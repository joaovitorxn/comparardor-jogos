import { isSamePrice, pickForRefresh } from "@/lib/refresh-order";
import { and, asc, eq, gt, inArray, isNotNull, isNull, like, lt, or, sql } from "drizzle-orm";
import { collectors, getCollector } from "@/collectors";
import { getGogOfferById } from "@/collectors/gog";
import { HttpError } from "@/collectors/http";
import { fetchPsConcept, psOffer } from "@/collectors/psstore";
import { fetchXboxProducts } from "@/collectors/xbox";
import { fetchConsoleExclusives, fetchIgdbDetails, igdbImageUrl, isIgdbConfigured, lookupIgdbIds, type IgdbExclusive } from "@/collectors/igdb";
import { fetchItadHistory, fetchItadPrices, isItadConfigured, ITAD_STORES, lookupItadIds } from "@/collectors/itad";
import { fetchDeckStatus, fetchPreorderDealAppIds, fetchSupportedLanguages, fetchUserReviews, getSteamGameDetails } from "@/collectors/steam";
import type { OfferPrice, StoreOffer } from "@/collectors/types";
import { db } from "@/db";
import { gameMedia, games, listings, priceHistory, priceSnapshots, skippedGames, type Game } from "@/db/schema";
import { isDifferentGame, parseReleaseDate } from "@/lib/release-date";
import { normalizeTitle, slugify } from "@/lib/text";

/** Slugs dos jogos que tiveram algum preço gravado desde `since`: são as páginas de jogo que precisam ser renovadas. */
export async function slugsWithNewPrices(since: Date): Promise<string[]> {
  const rows = await db
    .selectDistinct({ slug: games.slug })
    .from(listings)
    .innerJoin(games, eq(games.id, listings.gameId))
    .where(gt(listings.priceCapturedAt, since));
  return rows.map((r) => r.slug);
}

/** Grava um snapshot só se o preço mudou desde o último — mantém o histórico enxuto. */
export async function recordPrice(listingId: number, price: OfferPrice | null) {
  const now = new Date();
  // o próprio UPDATE devolve o preço atual da oferta (copiado do último snapshot): não precisa de outra consulta
  const [current] = await db
    .update(listings)
    .set({ lastCheckedAt: now, updatedAt: now })
    .where(eq(listings.id, listingId))
    .returning({ cents: listings.priceCents, regular: listings.priceRegularCents, currency: listings.priceCurrency });
  if (!price) return false;

  if (current && current.cents === price.priceCents && current.regular === price.regularPriceCents && current.currency === price.currency) {
    return false;
  }
  const [snapshot] = await db.insert(priceSnapshots).values({ listingId, ...price, capturedAt: now }).returning({ id: priceSnapshots.id });
  await db
    .update(listings)
    .set({
      priceSnapshotId: snapshot.id,
      priceCurrency: price.currency,
      priceCents: price.priceCents,
      priceRegularCents: price.regularPriceCents,
      priceDiscountPercent: price.discountPercent,
      priceCapturedAt: now,
    })
    .where(eq(listings.id, listingId));
  return true;
}

/** A oferta já gravada é igual à que a ITAD trouxe agora (nada a regravar)? */
function sameOffer(l: typeof listings.$inferSelect, o: StoreOffer, title: string): boolean {
  return (
    l.available &&
    o.price != null &&
    l.title === title &&
    l.platform === o.platform &&
    l.edition === (o.edition ?? "Padrão") &&
    l.drm === o.drm &&
    l.isKey === o.isKey &&
    l.url === o.url &&
    l.voucher === (o.voucher ?? null) &&
    l.priceCents === o.price.priceCents &&
    l.priceRegularCents === o.price.regularPriceCents &&
    l.priceCurrency === o.price.currency
  );
}

export async function saveOffer(gameId: number, offer: StoreOffer) {
  const values = {
    gameId,
    store: offer.store,
    storeProductId: offer.storeProductId,
    title: offer.title,
    platform: offer.platform,
    edition: offer.edition ?? "Padrão",
    drm: offer.drm,
    isKey: offer.isKey,
    url: offer.url,
    available: true,
    voucher: offer.voucher ?? null,
  };
  const [listing] = await db
    .insert(listings)
    .values(values)
    .onConflictDoUpdate({
      target: [listings.store, listings.storeProductId],
      set: { ...values, updatedAt: new Date() },
    })
    .returning();
  await recordPrice(listing.id, offer.price);
  return listing;
}

async function uniqueSlug(title: string, steamAppId: number) {
  const base = slugify(title) || `app-${steamAppId}`;
  const [taken] = await db.select({ steamAppId: games.steamAppId }).from(games).where(eq(games.slug, base));
  return !taken || taken.steamAppId === steamAppId ? base : `${base}-${steamAppId}`;
}

/** Procura o mesmo jogo nas outras lojas pelo título normalizado (só onde ainda não foi encontrado). */
export async function matchOtherStores(game: Pick<Game, "id" | "title">, { only }: { only?: string[] } = {}) {
  const target = normalizeTitle(game.title);
  const matched: StoreOffer[] = [];
  const [row] = await db.select({ releaseDate: games.releaseDate, platforms: games.platforms }).from(games).where(eq(games.id, game.id));
  const gameInfo = { release: parseReleaseDate(row?.releaseDate), platforms: row?.platforms ?? [] };
  const known = new Set(
    (
      await db
        .select({ store: listings.store })
        .from(listings)
        .where(and(eq(listings.gameId, game.id), eq(listings.available, true)))
    ).map((l) => l.store),
  );

  for (const collector of Object.values(collectors)) {
    if (!collector || known.has(collector.store) || (only && !only.includes(collector.store))) continue;
    try {
      const offers = await collector.findByTitle(game.title);
      // mesmo título não basta: o "Resident Evil 4" de 2005 não é o remake de 2023
      const exact = offers.find((o) => normalizeTitle(o.title) === target && !isDifferentGame(gameInfo, o));
      // a versão de Switch 2 é outro produto na eShop: entra como edição separada
      const switch2 = offers.find((o) => o.platform === "switch2" && normalizeTitle(o.title) === `${target} nintendo switch 2 edition`);
      for (const match of [exact, switch2 && { ...switch2, edition: "Nintendo Switch 2 Edition" }]) {
        if (!match) continue;
        await saveOffer(game.id, match);
        matched.push(match);
      }
    } catch (err) {
      console.warn(`[${collector.store}] falha ao buscar "${game.title}":`, err);
    }
  }
  return matched;
}

export class NotAGameError extends Error {}

// importações em andamento neste processo — duas visitas ao mesmo jogo novo esperam a mesma
const inflight = new Map<number, Promise<Game>>();

/**
 * Fase rápida (~1s): dados, mídia e preço da Steam. É o que a página do jogo precisa para
 * aparecer; as outras lojas vêm depois, em `enrichGame`.
 */
export function importSteamGameBasic(appId: number): Promise<Game> {
  const running = inflight.get(appId);
  if (running) return running;
  const job = doImportBasic(appId).finally(() => inflight.delete(appId));
  inflight.set(appId, job);
  return job;
}

async function doImportBasic(appId: number): Promise<Game> {
  const details = await getSteamGameDetails(appId);
  if (!details) throw new NotAGameError(`App ${appId} não é um jogo disponível na Steam`);

  const data = {
    title: details.title,
    normalizedTitle: normalizeTitle(details.title),
    shortDescription: details.shortDescription,
    developers: details.developers,
    publishers: details.publishers,
    genres: details.genres,
    releaseDate: details.releaseDate,
    coverUrl: details.coverUrl,
    headerUrl: details.headerUrl,
    backgroundUrl: details.backgroundUrl,
    metacritic: details.metacritic,
    website: details.website,
    requirements: details.requirements,
    languages: details.languages,
    steamAppId: appId,
  };

  const [existing] = await db.select().from(games).where(eq(games.steamAppId, appId));
  const [game] = existing
    ? await db.update(games).set({ ...data, updatedAt: new Date() }).where(eq(games.id, existing.id)).returning()
    : await db
        .insert(games)
        .values({ ...data, slug: await uniqueSlug(details.title, appId) })
        // outra instância do servidor pode ter inserido no meio do caminho
        .onConflictDoUpdate({ target: games.steamAppId, set: { ...data, updatedAt: new Date() } })
        .returning();

  await db.delete(gameMedia).where(eq(gameMedia.gameId, game.id));
  const media = [
    ...details.videos.map((v, i) => ({ gameId: game.id, type: "video" as const, url: v.url, thumbUrl: v.thumbUrl, title: v.title, position: i })),
    ...details.screenshots.map((s, i) => ({ gameId: game.id, type: "screenshot" as const, url: s.url, thumbUrl: s.thumbUrl, position: i })),
  ];
  if (media.length) await db.insert(gameMedia).values(media);

  await saveOffer(game.id, details.offer);
  return game;
}

/**
 * Fase lenta (alguns segundos): IGDB (que traz o id exato da GOG), busca por título nas
 * lojas que faltam e ITAD (Epic, Nuuvem, GMG, Microsoft + histórico). Falhas de uma fonte
 * não impedem as outras; no fim o jogo é marcado como completo de qualquer forma.
 */
export async function enrichGame(game: Pick<Game, "id" | "title">) {
  const matched: StoreOffer[] = [];
  try {
    const igdb = await syncIgdb({ gameIds: [game.id], maxAgeHours: 0 });
    if (igdb) matched.push(...igdb.offers);
  } catch (err) {
    console.warn(`[igdb] falha ao sincronizar "${game.title}":`, err);
  }
  try {
    matched.push(...(await syncConsoleStores([game.id])));
  } catch (err) {
    console.warn(`[consoles] falha ao buscar "${game.title}":`, err);
  }
  try {
    matched.push(...(await matchOtherStores(game)));
  } catch (err) {
    console.warn(`[lojas] falha ao buscar "${game.title}":`, err);
  }
  try {
    const itad = await syncItad({ gameIds: [game.id] });
    if (itad) matched.push(...itad.offers);
  } catch (err) {
    console.warn(`[itad] falha ao sincronizar "${game.title}":`, err);
  }
  await db.update(games).set({ enrichedAt: new Date() }).where(eq(games.id, game.id));
  return matched;
}

/**
 * Mesmo que `enrichGame`, para muitos jogos de uma vez: IGDB e ITAD aceitam consultas em
 * lote, então o pré-carregamento faz poucas chamadas em vez de várias por jogo.
 */
export async function enrichGames(list: Pick<Game, "id" | "title">[]) {
  if (!list.length) return;
  const ids = list.map((g) => g.id);
  try {
    await syncIgdb({ gameIds: ids, maxAgeHours: 0 });
  } catch (err) {
    console.warn("[igdb] falha no lote:", err);
  }
  try {
    await syncConsoleStores(ids);
  } catch (err) {
    console.warn("[consoles] falha no lote:", err);
  }
  for (const game of list) {
    try {
      await matchOtherStores(game);
    } catch (err) {
      console.warn(`[lojas] falha ao buscar "${game.title}":`, err);
    }
  }
  try {
    await syncItad({ gameIds: ids });
  } catch (err) {
    console.warn("[itad] falha no lote:", err);
  }
  await db.update(games).set({ enrichedAt: new Date() }).where(inArray(games.id, ids));
}

/** Importação completa, de uma vez (CLI e pré-carregamento). */
export async function importSteamGame(appId: number) {
  const game = await importSteamGameBasic(appId);
  const matched = await enrichGame(game);
  return { game, matched };
}

const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Data no mesmo formato que a Steam usa ("5/out./2026"). */
function formatReleaseDate(timestamp: number | null): string | null {
  if (timestamp == null) return null;
  const d = new Date(timestamp * 1000);
  return `${d.getUTCDate()}/${MONTHS_PT[d.getUTCMonth()]}./${d.getUTCFullYear()}`;
}

async function exclusiveSlug(title: string, igdbId: number) {
  const base = slugify(title) || `jogo-${igdbId}`;
  const [taken] = await db.select({ id: games.id }).from(games).where(eq(games.slug, base));
  return taken ? `${base}-${igdbId}` : base;
}

/**
 * Cria um exclusivo de console no catálogo a partir do IGDB e busca os preços (PS Store e
 * Nintendo eShop). Sem nenhuma oferta com preço, o jogo não fica no catálogo: devolve null e
 * lembra do descarte para não tentar de novo.
 */
export async function importConsoleExclusive(ex: IgdbExclusive): Promise<Game | null> {
  const data = {
    title: ex.title,
    normalizedTitle: normalizeTitle(ex.title),
    shortDescription: ex.summary,
    developers: ex.developers,
    publishers: ex.publishers,
    genres: ex.genres,
    releaseDate: formatReleaseDate(ex.releaseTimestamp),
    coverUrl: ex.coverImageId ? igdbImageUrl(ex.coverImageId, "cover_big_2x") : null,
    headerUrl: ex.heroImageId ? igdbImageUrl(ex.heroImageId, "1080p") : null,
    backgroundUrl: ex.heroImageId ? igdbImageUrl(ex.heroImageId, "1080p") : null,
    igdbId: ex.igdbId,
  };
  const [game] = await db
    .insert(games)
    .values({ ...data, slug: await exclusiveSlug(ex.title, ex.igdbId) })
    .returning();
  if (ex.screenshotImageIds.length) {
    await db.insert(gameMedia).values(
      ex.screenshotImageIds.map((id, i) => ({
        gameId: game.id,
        type: "screenshot" as const,
        url: igdbImageUrl(id, "1080p"),
        thumbUrl: igdbImageUrl(id, "screenshot_med"),
        position: i,
      })),
    );
  }

  await enrichGame(game);

  const [priced] = await db
    .select({ n: sql<number>`count(*)` })
    .from(listings)
    .where(and(eq(listings.gameId, game.id), eq(listings.available, true), isNotNull(listings.priceSnapshotId)));
  if (priced.n > 0) return game;

  await db.delete(games).where(eq(games.id, game.id));
  await db
    .insert(skippedGames)
    .values({ igdbId: ex.igdbId, reason: "sem preço nas lojas" })
    .onConflictDoUpdate({ target: skippedGames.igdbId, set: { createdAt: new Date() } });
  return null;
}

/**
 * Traz para o catálogo os exclusivos de PlayStation e Nintendo mais avaliados que ainda não
 * estão nele. Cada chamada processa até `limit` jogos novos (as lojas são lidas uma a uma).
 */
export async function syncExclusives({ limit = 8, scan = 150 }: { limit?: number; scan?: number } = {}) {
  if (!isIgdbConfigured()) return { imported: 0, skipped: 0 };
  const candidates = await fetchConsoleExclusives({ limit: scan });
  if (!candidates.length) return { imported: 0, skipped: 0 };

  const ids = candidates.map((c) => c.igdbId);
  const [inCatalog, ignored] = await Promise.all([
    db.select({ id: games.igdbId }).from(games).where(inArray(games.igdbId, ids)),
    // o descarte vale por 14 dias: a falha pode ter sido passageira (loja fora do ar, jogo ainda sem preço)
    db
      .select({ id: skippedGames.igdbId })
      .from(skippedGames)
      .where(and(inArray(skippedGames.igdbId, ids), gt(skippedGames.createdAt, new Date(Date.now() - 14 * 86_400_000)))),
  ]);
  const done = new Set([...inCatalog.map((g) => g.id), ...ignored.map((g) => g.id)]);

  let imported = 0;
  let skipped = 0;
  for (const ex of candidates.filter((c) => !done.has(c.igdbId))) {
    if (imported + skipped >= limit) break;
    try {
      if (await importConsoleExclusive(ex)) imported++;
      else skipped++;
    } catch (err) {
      console.warn(`[exclusivos] falha em "${ex.title}":`, err);
    }
  }
  return { imported, skipped };
}

/**
 * Pré-vendas com desconto na Steam entram no catálogo sozinhas (a página inicial as destaca).
 * Devolve quantos jogos novos foram importados.
 */
export async function syncPreorders(): Promise<number> {
  const appIds = await fetchPreorderDealAppIds();
  if (!appIds.length) return 0;
  const known = new Set((await db.select({ id: games.steamAppId }).from(games).where(inArray(games.steamAppId, appIds))).map((g) => g.id));
  let imported = 0;
  for (const appId of appIds.filter((id) => !known.has(id))) {
    try {
      await importSteamGame(appId);
      imported++;
    } catch (err) {
      if (!(err instanceof NotAGameError)) console.error(`pré-venda ${appId}:`, err);
    }
  }
  return imported;
}

/**
 * Busca na IsThereAnyDeal as ofertas das lojas sem coletor próprio (Epic, Nuuvem, GMG,
 * Microsoft Store) e o menor preço histórico. Sem `gameIds`, sincroniza o catálogo todo.
 */
export async function syncItad({ gameIds: only, historyLimit, deadline }: { gameIds?: number[]; historyLimit?: number; deadline?: number } = {}) {
  if (!isItadConfigured()) return null;

  const rows = await db
    .select({ id: games.id, title: games.title, steamAppId: games.steamAppId, itadId: games.itadId, historyLowCents: games.historyLowCents })
    .from(games)
    .where(only ? inArray(games.id, only) : undefined);

  // jogos novos: descobre o id da ITAD pelo appid da Steam (casamento exato, sem depender do título)
  const missing = rows.filter((r) => !r.itadId && r.steamAppId != null);
  if (missing.length) {
    const ids = await lookupItadIds(missing.map((r) => r.steamAppId!));
    for (const row of missing) {
      row.itadId = ids.get(row.steamAppId!) ?? null;
      if (row.itadId) await db.update(games).set({ itadId: row.itadId }).where(eq(games.id, row.id));
    }
  }

  const byItadId = new Map(rows.filter((r) => r.itadId).map((r) => [r.itadId!, r]));
  if (!byItadId.size) return { games: 0, offers: [] as StoreOffer[] };

  // jogos cuja oferta direta da Xbox já vale para PC (Play Anywhere): a Microsoft Store (PC) da ITAD seria duplicata
  const playAnywhere = new Set(
    (
      await db
        .select({ gameId: listings.gameId })
        .from(listings)
        .where(
          and(
            inArray(listings.gameId, [...byItadId.values()].map((g) => g.id)),
            eq(listings.store, "xbox"),
            eq(listings.available, true),
            like(listings.edition, "Play Anywhere%"),
          ),
        )
    ).map((r) => r.gameId),
  );

  // O catálogo tem milhares de jogos e quase nada muda entre uma coleta e outra. Em vez de gravar tudo jogo a jogo
  // (dezenas de milhares de consultas em sequência), lê o que já existe e só grava o que mudou.
  const gameIds = [...byItadId.values()].map((g) => g.id);
  const existing = new Map<string, typeof listings.$inferSelect>();
  for (let i = 0; i < gameIds.length; i += 500) {
    for (const l of await db
      .select()
      .from(listings)
      .where(and(inArray(listings.gameId, gameIds.slice(i, i + 500)), like(listings.storeProductId, "itad:%")))) {
      existing.set(`${l.store}|${l.storeProductId}`, l);
    }
  }
  const previousLow = new Map(rows.map((r) => [r.id, r.historyLowCents]));

  const offers: StoreOffer[] = [];
  const touched: number[] = [];
  const gone: number[] = [];
  for (const prices of await fetchItadPrices([...byItadId.keys()])) {
    const game = byItadId.get(prices.itadId);
    if (!game) continue;

    if (prices.historyLowCents !== previousLow.get(game.id)) {
      await db.update(games).set({ historyLowCents: prices.historyLowCents }).where(eq(games.id, game.id));
    }
    const kept = prices.offers.filter((o) => !(o.store === "msstore" && playAnywhere.has(game.id)));
    for (const offer of kept) {
      const current = existing.get(`${offer.store}|${offer.storeProductId}`);
      if (current && sameOffer(current, offer, game.title)) {
        touched.push(current.id);
      } else {
        await saveOffer(game.id, { ...offer, title: game.title });
      }
      offers.push(offer);
    }

    // lojas que pararam de vender o jogo saem da comparação (o histórico fica) — só ofertas vindas da ITAD
    const seen = new Set<string>(kept.map((o) => o.store));
    for (const l of existing.values()) {
      if (l.gameId === game.id && l.available && !seen.has(l.store) && ITAD_STORES.has(l.store)) gone.push(l.id);
    }
  }
  // as ofertas que continuam iguais só ganham a data da última checagem, em lote
  const now = new Date();
  for (let i = 0; i < touched.length; i += 500) {
    await db.update(listings).set({ lastCheckedAt: now, updatedAt: now }).where(inArray(listings.id, touched.slice(i, i + 500)));
  }
  for (let i = 0; i < gone.length; i += 500) {
    await db.update(listings).set({ available: false, updatedAt: now }).where(inArray(listings.id, gone.slice(i, i + 500)));
  }
  await syncItadHistory({ gameIds, limit: historyLimit, deadline });
  return { games: byItadId.size, offers };
}

/**
 * Metadados do IGDB (plataformas, tempo para zerar, nota da crítica, jogos parecidos) e IDs
 * do jogo nas outras lojas. Com o id da GOG em mãos, cria a oferta da GOG pelo id exato.
 * Jogos sincronizados há menos de `maxAgeHours` são pulados (metadados mudam pouco).
 */
export async function syncIgdb({ gameIds, maxAgeHours = 24 * 7, limit }: { gameIds?: number[]; maxAgeHours?: number; limit?: number } = {}) {
  if (!isIgdbConfigured()) return null;
  const cutoff = new Date(Date.now() - maxAgeHours * 3_600_000);
  const rows = await db
    .select({ id: games.id, title: games.title, steamAppId: games.steamAppId, igdbId: games.igdbId })
    .from(games)
    .where(
      and(
        gameIds ? inArray(games.id, gameIds) : undefined,
        maxAgeHours > 0 ? or(isNull(games.igdbSyncedAt), lt(games.igdbSyncedAt, cutoff)) : undefined,
      ),
    )
    .orderBy(asc(games.igdbSyncedAt))
    .limit(limit ?? -1);

  const missing = rows.filter((r) => r.igdbId == null && r.steamAppId != null);
  if (missing.length) {
    const ids = await lookupIgdbIds(missing.map((r) => r.steamAppId!));
    for (const row of missing) {
      row.igdbId = ids.get(row.steamAppId!) ?? null;
      if (row.igdbId) await db.update(games).set({ igdbId: row.igdbId }).where(eq(games.id, row.id));
    }
  }

  const byIgdbId = new Map(rows.filter((r) => r.igdbId != null).map((r) => [r.igdbId!, r]));
  const offers: StoreOffer[] = [];
  if (!byIgdbId.size) return { games: 0, offers };

  for (const details of await fetchIgdbDetails([...byIgdbId.keys()])) {
    const game = byIgdbId.get(details.igdbId);
    if (!game) continue;
    await db
      .update(games)
      .set({
        platforms: details.platforms,
        gameModes: details.gameModes,
        themes: details.themes,
        perspectives: details.perspectives,
        criticRating: details.criticRating,
        criticRatingCount: details.criticRatingCount,
        timeToBeat: details.timeToBeat,
        similarGames: details.similarGames,
        externalIds: details.externalIds,
        igdbSyncedAt: new Date(),
      })
      .where(eq(games.id, game.id));

    // GOG pelo id exato, se ainda não temos o jogo lá
    if (details.externalIds.gog) {
      const [existing] = await db
        .select({ id: listings.id })
        .from(listings)
        .where(and(eq(listings.gameId, game.id), eq(listings.store, "gog"), eq(listings.available, true)));
      if (!existing) {
        try {
          const offer = await getGogOfferById(details.externalIds.gog);
          if (offer?.price) {
            await saveOffer(game.id, offer);
            offers.push(offer);
          }
        } catch (err) {
          console.warn(`[gog] falha ao buscar produto ${details.externalIds.gog}:`, err);
        }
      }
    }
  }
  return { games: byIgdbId.size, offers };
}

/**
 * Xbox e PlayStation Store pelos ids que o IGDB informa (a Nintendo entra por busca de
 * título, em matchOtherStores). A PS Store é lida página a página, então vai devagar.
 */
export async function syncConsoleStores(gameIds: number[]) {
  if (!gameIds.length) return [];
  const rows = await db.select({ id: games.id, externalIds: games.externalIds }).from(games).where(inArray(games.id, gameIds));
  const offers: StoreOffer[] = [];

  // Xbox: todos os jogos numa leva só (20 produtos por chamada)
  const bigIds = [...new Set(rows.flatMap((r) => r.externalIds.xbox ?? []))];
  if (bigIds.length) {
    try {
      const products = await fetchXboxProducts(bigIds);
      for (const row of rows) {
        // um jogo pode ter vários ids (edições, versão de PC); fica com o mais barato que roda no Xbox
        const candidates = (row.externalIds.xbox ?? []).flatMap((id) => (products.get(id) ? [products.get(id)!] : []));
        const best = candidates.sort((a, b) => (a.offer.price?.priceCents ?? Infinity) - (b.offer.price?.priceCents ?? Infinity))[0];
        if (!best) continue;
        await saveOffer(row.id, best.offer);
        offers.push(best.offer);
      }
    } catch (err) {
      console.warn("[xbox] falha no lote:", err);
    }
  }

  for (const row of rows) {
    const conceptId = row.externalIds.psstore?.[0];
    if (!conceptId) continue;
    try {
      const concept = await fetchPsConcept(conceptId);
      if (concept) {
        const offer = psOffer(conceptId, concept);
        await saveOffer(row.id, offer);
        offers.push(offer);
      }
    } catch (err) {
      console.warn(`[psstore] falha no concept ${conceptId}:`, err);
      // bloqueio da loja: não insiste com os próximos
      if (err instanceof HttpError && (err.status === 403 || err.status === 429)) break;
    }
    if (rows.length > 1) await new Promise((r) => setTimeout(r, 1500));
  }
  return offers;
}

const HISTORY_YEARS = 5;

/**
 * Importa o histórico de preços da ITAD (uma chamada por jogo). Jogos sincronizados há
 * menos de `maxAgeHours` são pulados; os demais buscam só o que mudou desde a última vez.
 */
export async function syncItadHistory({ gameIds, maxAgeHours = 24, limit, deadline }: { gameIds?: number[]; maxAgeHours?: number; limit?: number; deadline?: number } = {}) {
  if (!isItadConfigured()) return 0;
  const cutoff = new Date(Date.now() - maxAgeHours * 3_600_000);
  const rows = await db
    .select({ id: games.id, itadId: games.itadId, historySyncedAt: games.historySyncedAt })
    .from(games)
    .where(
      and(
        isNotNull(games.itadId),
        or(isNull(games.historySyncedAt), lt(games.historySyncedAt, cutoff)),
        gameIds ? inArray(games.id, gameIds) : undefined,
      ),
    )
    .orderBy(asc(games.historySyncedAt))
    .limit(limit ?? -1);

  let inserted = 0;
  for (const game of rows) {
    // um jogo por vez, cada um uma chamada à ITAD: sem limite de tempo, a rodada inteira estourava os 300s da função
    if (deadline != null && Date.now() > deadline) break;
    const since = game.historySyncedAt
      ? new Date(game.historySyncedAt.getTime() - 86_400_000) // 1 dia de folga
      : new Date(Date.now() - HISTORY_YEARS * 365 * 86_400_000);
    try {
      const entries = await fetchItadHistory(game.itadId!, since);
      if (entries.length) {
        const res = await db
          .insert(priceHistory)
          .values(entries.map((e) => ({ ...e, gameId: game.id })))
          .onConflictDoNothing()
          .returning({ id: priceHistory.id });
        inserted += res.length;
      }
      await db.update(games).set({ historySyncedAt: new Date() }).where(eq(games.id, game.id));
    } catch (err) {
      // a ITAD limitou as chamadas: insistir só gasta tempo; o resto fica para a próxima rodada
      if (err instanceof HttpError && err.status === 429) break;
      console.warn(`[itad] falha no histórico do jogo ${game.id}:`, err);
    }
  }
  return inserted;
}

/** Atualiza preços das listagens não verificadas há mais de `olderThanMinutes`. */
/** A PS Store não tem API: lemos páginas, então com bem menos frequência e em lotes pequenos. */
const STORE_MIN_AGE_MINUTES: Record<string, number> = { psstore: 12 * 60 };
// limite próprio de cada loja (vale no lugar do geral). A Steam aceita 50 jogos por chamada: o catálogo inteiro (~3,3 mil) leva
// ~65 chamadas e cerca de 30 s, então ela é verificada por inteiro a cada rodada. A PS Store espera 1,5 s por jogo, daí o limite baixo
const STORE_MAX_PER_RUN: Record<string, number> = { psstore: 40, steam: 4000 };

export interface RefreshLimits {
  /** Máximo de listagens por loja nesta execução (as mais desatualizadas primeiro). */
  maxPerStore?: number;
  /** Máximo de jogos com histórico da ITAD atualizado nesta execução. */
  maxHistory?: number;
  /** Máximo de jogos com metadados do IGDB atualizados nesta execução. */
  maxIgdb?: number;
  /** Instante (ms) a partir do qual não se começa mais nada: a função serverless tem tempo máximo e, se estourar, nada depois roda. */
  deadline?: number;
}

/**
 * Atualiza preços das listagens não verificadas há mais de `olderThanMinutes`.
 * Os limites deixam cada execução curta (cabe numa função serverless); com execuções
 * frequentes, o catálogo inteiro é coberto em rodízio.
 */
/** Marca várias ofertas como verificadas agora, em lotes (um UPDATE por lote em vez de um por oferta). */
async function markChecked(ids: number[]) {
  const now = new Date();
  for (let i = 0; i < ids.length; i += 400) {
    await db.update(listings).set({ lastCheckedAt: now, updatedAt: now }).where(inArray(listings.id, ids.slice(i, i + 400)));
  }
}

export async function refreshPrices({
  olderThanMinutes = 60,
  store,
  maxPerStore,
  maxHistory,
  maxIgdb,
  deadline,
}: { olderThanMinutes?: number; store?: string } & RefreshLimits = {}) {
  const over = () => deadline != null && Date.now() > deadline;
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
  const stale = await db
    .select({ id: listings.id, store: listings.store, storeProductId: listings.storeProductId, lastCheckedAt: listings.lastCheckedAt, discount: listings.priceDiscountPercent, priceCents: listings.priceCents, priceRegularCents: listings.priceRegularCents, priceCurrency: listings.priceCurrency })
    .from(listings)
    .where(
      and(
        or(isNull(listings.lastCheckedAt), lt(listings.lastCheckedAt, cutoff)),
        store ? eq(listings.store, store) : sql`1 = 1`,
      ),
    )
    // nunca verificadas (null) e as mais antigas primeiro
    .orderBy(asc(listings.lastCheckedAt));

  const now = Date.now();
  const byStore = new Map(
    [...Map.groupBy(stale, (l) => l.store)].map(([s, rows]) => {
      const minAge = (STORE_MIN_AGE_MINUTES[s] ?? 0) * 60_000;
      const due = rows.filter((r) => !r.storeProductId.startsWith("itad:") && (!minAge || !r.lastCheckedAt || now - r.lastCheckedAt.getTime() > minAge));
      const cap = STORE_MAX_PER_RUN[s] ?? maxPerStore ?? Infinity;
      return [s, pickForRefresh(due, cap)];
    }),
  );
  /** `ms`: quanto a etapa demorou. */
  const summary: Record<string, { checked: number; changed: number; error?: string; ms?: number }> = {};

  // a ITAD traz os preços de Epic, Nuuvem, GMG e Microsoft Store e responde o catálogo inteiro em poucas
  // chamadas, então vem primeiro: é o que mais pesa para o usuário
  if ((!store || ITAD_STORES.has(store)) && !over()) {
    const started = Date.now();
    try {
      // o histórico (uma chamada por jogo) pode usar até 60s, e nunca passa do prazo da execução
      const itad = await syncItad({ historyLimit: maxHistory, deadline: Math.min(deadline ?? Infinity, Date.now() + 60_000) });
      if (itad) summary.itad = { checked: itad.games, changed: itad.offers.length, ms: Date.now() - started };
    } catch (err) {
      summary.itad = { checked: 0, changed: 0, error: String(err), ms: Date.now() - started };
    }
  }

  // as lojas rápidas primeiro; a PS Store (1,5 s de espera por jogo, de propósito) por último e só com o que couber no tempo
  const PS_SECONDS_PER_GAME = 2.6;
  const ordered = [...byStore].sort(([x], [y]) => Number(x === "psstore") - Number(y === "psstore"));
  for (const [storeId, allRows] of ordered) {
    const collector = getCollector(storeId);
    if (!collector || over()) continue;
    let rows = allRows;
    if (storeId === "psstore" && deadline != null) rows = rows.slice(0, Math.max(0, Math.floor((deadline - Date.now()) / 1000 / PS_SECONDS_PER_GAME)));
    if (!rows.length) continue;
    summary[storeId] = { checked: 0, changed: 0 };
    const started = Date.now();
    try {
      const prices = await collector.fetchPrices(rows.map((r) => r.storeProductId));
      // o que já foi lido é gravado mesmo que o tempo tenha acabado no meio. Quase tudo continua com o mesmo preço: essas
      // ofertas só são marcadas como verificadas, em lotes (um UPDATE por oferta levava ~90 s só para a Steam); só as que
      // mudaram passam por recordPrice
      const unchanged: number[] = [];
      try {
        for (const row of rows) {
          if (!prices.has(row.storeProductId)) continue;
          summary[storeId].checked++;
          const price = prices.get(row.storeProductId) ?? null;
          if (price == null || isSamePrice(row, price)) unchanged.push(row.id);
          else if (await recordPrice(row.id, price)) summary[storeId].changed++;
        }
      } finally {
        await markChecked(unchanged);
      }
    } catch (err) {
      summary[storeId].error = String(err);
    }
    summary[storeId].ms = Date.now() - started;
  }

  // jogos importados pela busca cujo complemento em segundo plano não terminou (ex.: servidor reiniciou)
  if (!store && !over()) {
    const started = Date.now();
    const stuck = await db
      .select({ id: games.id, title: games.title })
      .from(games)
      .where(and(isNull(games.enrichedAt), lt(games.createdAt, new Date(Date.now() - 10 * 60_000))));
    for (const game of stuck.slice(0, 20)) await enrichGame(game);
    if (stuck.length) summary.pendentes = { checked: stuck.length, changed: stuck.length, ms: Date.now() - started };
  }

  // metadados do IGDB mudam pouco: só jogos sincronizados há mais de uma semana
  if (!store && !over()) {
    const started = Date.now();
    try {
      const igdb = await syncIgdb({ limit: maxIgdb });
      if (igdb) summary.igdb = { checked: igdb.games, changed: igdb.offers.length, ms: Date.now() - started };
    } catch (err) {
      summary.igdb = { checked: 0, changed: 0, error: String(err), ms: Date.now() - started };
    }
  }

  return summary;
}

/**
 * Atualiza as avaliações dos jogadores (Steam): primeiro os nunca consultados; depois os lançamentos dos últimos 60 dias,
 * que mudam rápido, uma vez por dia; os demais a cada 14 dias. Poucos por rodada e devagar.
 */
export async function syncUserReviews({ limit = 50, deadline, pauseMs = 1500 }: { limit?: number; deadline?: number; pauseMs?: number } = {}) {
  const now = Date.now();
  const DAY = 86_400_000;
  const rows = await db
    .select({ id: games.id, steamAppId: games.steamAppId, releaseDate: games.releaseDate, checkedAt: games.userReviewsCheckedAt })
    .from(games)
    .where(isNotNull(games.steamAppId));
  const due = rows
    .filter((r) => {
      if (!r.checkedAt) return true;
      const released = parseReleaseDate(r.releaseDate)?.getTime();
      const recent = released != null && released <= now && now - released < 60 * DAY;
      return now - r.checkedAt.getTime() > (recent ? 1 : 14) * DAY;
    })
    .sort((a, b) => (a.checkedAt?.getTime() ?? 0) - (b.checkedAt?.getTime() ?? 0));
  const batch = due.slice(0, limit);
  let checked = 0;
  let blocked = false;
  for (const g of batch) {
    if (deadline != null && Date.now() > deadline) break;
    try {
      const reviews = await fetchUserReviews(g.steamAppId!);
      if (reviews) {
        await db.update(games).set({ userScore: reviews.percent, userReviewCount: reviews.total, userReviewsCheckedAt: new Date() }).where(eq(games.id, g.id));
        checked++;
      }
    } catch (err) {
      // bloqueio da loja (a consulta de avaliações aceita ~200 por 5 minutos): para a rodada e tenta de novo na próxima
      if (err instanceof HttpError && (err.status === 403 || err.status === 429)) {
        blocked = true;
        break;
      }
    }
    await new Promise((r) => setTimeout(r, pauseMs));
  }
  return { checked, blocked, remaining: due.length - checked };
}

/**
 * Atualiza o status do Steam Deck dos jogos da Steam: primeiro os nunca consultados, depois os consultados há mais
 * de 30 dias (a Valve vai verificando jogos novos). Poucos por rodada e devagar, para não sobrecarregar a loja.
 */
export async function syncDeckStatus({ limit = 60, deadline }: { limit?: number; deadline?: number } = {}) {
  const cutoff = new Date(Date.now() - 30 * 86_400_000);
  const rows = await db
    .select({ id: games.id, steamAppId: games.steamAppId })
    .from(games)
    .where(and(isNotNull(games.steamAppId), or(isNull(games.deckCheckedAt), lt(games.deckCheckedAt, cutoff))))
    .orderBy(asc(games.deckCheckedAt))
    .limit(limit);
  let checked = 0;
  for (const g of rows) {
    if (deadline != null && Date.now() > deadline) break;
    try {
      const status = await fetchDeckStatus(g.steamAppId!);
      if (status != null) {
        await db.update(games).set({ deckStatus: status, deckCheckedAt: new Date() }).where(eq(games.id, g.id));
        checked++;
      }
    } catch (err) {
      // bloqueio da loja: para a rodada e tenta de novo na próxima
      if (err instanceof HttpError && (err.status === 403 || err.status === 429)) break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return checked;
}

/**
 * Preenche os idiomas dos jogos da Steam que ainda não têm (uma consulta por jogo, devagar). Idiomas quase não mudam,
 * então cada jogo é consultado uma vez; os importados depois já nascem com eles.
 */
export async function syncLanguages({ limit = 40, deadline, pauseMs = 400 }: { limit?: number; deadline?: number; pauseMs?: number } = {}) {
  const rows = await db
    .select({ id: games.id, steamAppId: games.steamAppId })
    .from(games)
    .where(and(isNotNull(games.steamAppId), isNull(games.languages)))
    .limit(limit);
  let checked = 0;
  for (const g of rows) {
    if (deadline != null && Date.now() > deadline) break;
    try {
      const languages = await fetchSupportedLanguages(g.steamAppId!);
      if (languages) {
        await db.update(games).set({ languages }).where(eq(games.id, g.id));
        checked++;
      }
    } catch (err) {
      // bloqueio da loja: para a rodada e tenta de novo na próxima
      if (err instanceof HttpError && (err.status === 403 || err.status === 429)) break;
    }
    await new Promise((r) => setTimeout(r, pauseMs));
  }
  return checked;
}
