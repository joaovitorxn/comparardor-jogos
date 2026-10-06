import { and, asc, desc, eq, inArray, isNotNull, like, or, sql } from "drizzle-orm";
import { cache } from "react";
import { bestByFamily, type BestPrice, type FamilyKey, type PricedOffer } from "@/lib/best-by-family";
import { ITAD_HISTORY_STORES } from "@/collectors/itad";
import { onePerFranchise } from "@/lib/franchise";
import { parseReleaseDate } from "@/lib/release-date";
import { compareOffers, offerFamilies, PLATFORM_FAMILIES, type PlatformFamilyId } from "@/lib/stores";
import { normalizeTitle } from "@/lib/text";
import { db } from ".";
import {
  gameMedia,
  games,
  listings,
  priceHistory,
  priceSnapshots,
  type Game,
  type Platform,
  type Listing,
  type PriceSnapshot,
  type SimilarGame,
} from "./schema";

/**
 * Preço atual de cada oferta à venda. Fica na própria linha da oferta (copiado do último snapshot quando o preço
 * muda), então estas consultas leem uma tabela só, sem juntar com o histórico de preços.
 */
async function latestPrices(gameIds?: number[]): Promise<{ listing: Listing; snapshot: PriceSnapshot }[]> {
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.available, true), isNotNull(listings.priceSnapshotId), gameIds ? inArray(listings.gameId, gameIds) : undefined));
  return rows.map((listing) => ({
    listing,
    snapshot: {
      id: listing.priceSnapshotId!,
      listingId: listing.id,
      currency: listing.priceCurrency!,
      priceCents: listing.priceCents!,
      regularPriceCents: listing.priceRegularCents!,
      discountPercent: listing.priceDiscountPercent ?? 0,
      capturedAt: listing.priceCapturedAt ?? listing.updatedAt,
    },
  }));
}

/**
 * Só o que as vitrines usam de cada jogo (cartões, filtros, ranking). A lista de promoções fica na memória e
 * poderá ir para um cache compartilhado, então carrega estas colunas em vez da linha inteira (requisitos,
 * descrições e jogos parecidos pesam MBs). As imagens de cabeçalho e fundo só o banner usa: `getShowcaseImages`.
 */
const dealGameColumns = {
  id: games.id,
  slug: games.slug,
  title: games.title,
  coverUrl: games.coverUrl,
  releaseDate: games.releaseDate,
  criticRating: games.criticRating,
  criticRatingCount: games.criticRatingCount,
  metacritic: games.metacritic,
  historyLowCents: games.historyLowCents,
  developers: games.developers,
  publishers: games.publishers,
  genres: games.genres,
};
export type DealGame = Pick<Game, keyof typeof dealGameColumns>;

export interface GameSummary {
  game: DealGame;
  bestPriceCents: number | null;
  regularPriceCents: number | null;
  maxDiscount: number;
  storeCount: number;
  bestStore: string | null;
  /** Plataforma da melhor oferta e plataformas em que o jogo está à venda (dentro do recorte pedido). */
  bestPlatform: Platform | null;
  families: PlatformFamilyId[];
  /** Lojas com oferta do jogo (para o filtro de loja). */
  stores: string[];
}

/** Famílias de plataforma (PC, PlayStation…) das ofertas, na ordem de sempre. */
function familiesOf(offers: { listing: Listing }[]): PlatformFamilyId[] {
  const found = new Set(offers.flatMap((o) => offerFamilies(o.listing)));
  return PLATFORM_FAMILIES.map((f) => f.id).filter((id) => found.has(id));
}

async function summarize(rows: DealGame[]): Promise<GameSummary[]> {
  if (!rows.length) return [];
  const offers: Awaited<ReturnType<typeof latestPrices>> = [];
  for (let i = 0; i < rows.length; i += 500) offers.push(...(await latestPrices(rows.slice(i, i + 500).map((g) => g.id))));
  const prices = Map.groupBy(offers, (p) => p.listing.gameId);
  return rows.map((game) => {
    const offers = prices.get(game.id) ?? [];
    const best = offers.reduce<(typeof offers)[number] | null>(
      (acc, o) =>
        !acc || compareOffers({ cents: o.snapshot.priceCents, store: o.listing.store }, { cents: acc.snapshot.priceCents, store: acc.listing.store }) < 0 ? o : acc,
      null,
    );
    return {
      game,
      bestPriceCents: best?.snapshot.priceCents ?? null,
      regularPriceCents: best?.snapshot.regularPriceCents ?? null,
      maxDiscount: Math.max(0, ...offers.map((o) => o.snapshot.discountPercent)),
      storeCount: offers.length,
      bestStore: best?.listing.store ?? null,
      bestPlatform: best?.listing.platform ?? null,
      families: familiesOf(offers),
      stores: [...new Set(offers.map((o) => o.listing.store))],
    };
  });
}

export async function getGameSummaries({
  q,
  steamAppIds,
  limit = 60,
}: { q?: string; steamAppIds?: number[]; limit?: number } = {}): Promise<GameSummary[]> {
  const term = q ? normalizeTitle(q) : "";
  if (steamAppIds && !steamAppIds.length) return [];
  const rows = await db
    .select()
    .from(games)
    .where(and(term ? like(games.normalizedTitle, `%${term}%`) : undefined, steamAppIds ? inArray(games.steamAppId, steamAppIds) : undefined))
    .orderBy(desc(games.updatedAt))
    .limit(limit);
  return summarize(rows);
}

/** Menor preço de vitrine atual de cada jogo, por família de plataforma ("all" = qualquer uma). */
export async function getBestPricesByFamily(gameIds: number[]): Promise<Map<number, Map<FamilyKey, BestPrice>>> {
  const offersByGame = new Map<number, PricedOffer[]>();
  for (let i = 0; i < gameIds.length; i += 500) {
    for (const { listing, snapshot } of await latestPrices(gameIds.slice(i, i + 500))) {
      const list = offersByGame.get(listing.gameId) ?? [];
      list.push({
        store: listing.store,
        platform: listing.platform,
        edition: listing.edition,
        cents: snapshot.priceCents,
        regularCents: snapshot.regularPriceCents,
        discountPercent: snapshot.discountPercent,
      });
      offersByGame.set(listing.gameId, list);
    }
  }
  return new Map([...offersByGame].map(([gameId, offers]) => [gameId, bestByFamily(offers)]));
}

/** Menor preço de vitrine atual de cada jogo, entre todas as plataformas. */
export async function getBestPrices(gameIds: number[]): Promise<Map<number, BestPrice>> {
  const byFamily = await getBestPricesByFamily(gameIds);
  return new Map([...byFamily].flatMap(([id, m]) => (m.has("all") ? [[id, m.get("all")!] as const] : [])));
}

export interface Paged<T> {
  items: T[];
  total: number;
}

export type DealSort = "desconto" | "preco";

/**
 * Jogos com desconto em alguma loja — sobre o catálogo inteiro. Por padrão do maior desconto para o
 * menor; "preco" ordena pelo menor preço (sem os grátis, que não são promoção).
 */
export async function getDeals({ limit, offset = 0, sort = "desconto" }: { limit: number; offset?: number; sort?: DealSort }): Promise<Paged<GameSummary>> {
  const perGame = db
    .select({
      gameId: listings.gameId,
      maxDiscount: sql<number>`max(${listings.priceDiscountPercent})`.as("max_discount"),
      bestPrice: sql<number>`min(${listings.priceCents})`.as("best_price"),
    })
    .from(listings)
    .where(and(eq(listings.available, true), isNotNull(listings.priceSnapshotId)))
    .groupBy(listings.gameId)
    .as("per_game");

  const onSale = sort === "preco" ? sql`${perGame.maxDiscount} > 0 and ${perGame.bestPrice} > 0` : sql`${perGame.maxDiscount} > 0`;
  const [ranked, [{ total }]] = await Promise.all([
    db
      .select({ gameId: perGame.gameId })
      .from(perGame)
      .where(onSale)
      .orderBy(...(sort === "preco" ? [asc(perGame.bestPrice), desc(perGame.maxDiscount)] : [desc(perGame.maxDiscount), asc(perGame.bestPrice)]))
      .limit(limit)
      .offset(offset),
    db.select({ total: sql<number>`count(*)` }).from(perGame).where(onSale),
  ]);
  if (!ranked.length) return { items: [], total };

  const rows: DealGame[] = [];
  for (let i = 0; i < ranked.length; i += 500) {
    rows.push(...(await db.select(dealGameColumns).from(games).where(inArray(games.id, ranked.slice(i, i + 500).map((r) => r.gameId)))));
  }
  const byId = new Map(rows.map((g) => [g.id, g]));
  return { items: await summarize(ranked.flatMap((r) => byId.get(r.gameId) ?? [])), total };
}

/** Ano do campo de texto de lançamento da Steam ("13/dez./2022", "Q2 2025"…). */
function releaseYear(text: string | null): number | null {
  const m = text?.match(/\b(?:19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

/** Qualidade do jogo (0-100): nota da crítica; com pouca crítica a nota é puxada para 60, e sem nota fica em 55. */
function qualityOf(game: DealGame): number {
  const rating = game.criticRating ?? game.metacritic;
  const trust = Math.min(1, (game.criticRatingCount ?? (game.metacritic ? 5 : 0)) / 5);
  return rating != null ? 60 + (rating - 60) * trust : 55;
}

/** Nota mínima para um jogo contar como "bom" nos destaques. */
const MIN_QUALITY = 70;

/**
 * Pontuação de destaque: jogo bom em ótimo preço. O que mais pesa é o preço estar perto do menor já
 * registrado (até 50 pontos); depois a qualidade (até ~35), o tamanho do desconto (até 15) e, de leve,
 * ser recente (até 10). Sem o menor preço histórico, vale só o desconto.
 */
function featuredScore(s: GameSummary, year: number): number {
  const { game } = s;
  const quality = Math.max(0, qualityOf(game) - 60);
  const discount = Math.min(s.maxDiscount, 80) / 80;
  const low = game.historyLowCents;
  const best = s.bestPriceCents;
  // 1 = no menor preço de sempre; cai conforme o preço fica acima dele
  const nearLow = low != null && low > 0 && best != null && best > 0 ? Math.min(1, low / best) : null;
  const value = nearLow != null ? 50 * nearLow * nearLow : 30 * discount;
  const released = releaseYear(game.releaseDate);
  const age = released == null ? 8 : Math.max(0, year - released);
  const recency = age <= 1 ? 10 : age <= 2 ? 7 : age <= 4 ? 4 : age <= 7 ? 1 : 0;
  return quality + value + 15 * discount + recency;
}

/** Ainda não lançado (o dia do lançamento já conta como lançado). */
function isUnreleased(game: DealGame, now: Date): boolean {
  const date = parseReleaseDate(game.releaseDate);
  return date != null && date > now;
}

/** Imagens grandes (cabeçalho e fundo) dos jogos do banner da home, que não vêm na lista de promoções. */
export async function getShowcaseImages(ids: number[]): Promise<Map<number, { headerUrl: string | null; backgroundUrl: string | null }>> {
  if (!ids.length) return new Map();
  const rows = await db.select({ id: games.id, headerUrl: games.headerUrl, backgroundUrl: games.backgroundUrl }).from(games).where(inArray(games.id, ids));
  return new Map(rows.map((r) => [r.id, r]));
}

/** Todos os jogos em promoção, para a home escolher destaques e pré-vendas sem repetir consultas. */
const poolCache = new Map<string, { at: number; pool: Promise<GameSummary[]> }>();
// os preços só mudam quando o robô de coleta roda (de hora em hora), então 15 min não se nota
const POOL_TTL_MS = 15 * 60_000;

/**
 * Todos os jogos em promoção. Com `platforms`, só contam as ofertas das plataformas escolhidas (o
 * preço, o desconto e a loja de cada jogo vêm só delas) e só entram jogos com desconto nelas.
 */
export function getDealPool(platforms: PlatformFamilyId[] = []): Promise<GameSummary[]> {
  // a página de ofertas é dinâmica; sem isso cada acesso refaria o ranking inteiro
  const key = platforms.join("-");
  const cached = poolCache.get(key);
  if (cached && Date.now() - cached.at < POOL_TTL_MS) return cached.pool;
  const pool = platforms.length ? getPlatformDeals(platforms) : getDeals({ limit: 100_000 }).then((r) => r.items);
  poolCache.set(key, { at: Date.now(), pool });
  pool.catch(() => {
    if (poolCache.get(key)?.pool === pool) poolCache.delete(key);
  });
  return pool;
}

/** Promoções vistas só pelas ofertas das plataformas escolhidas. */
async function getPlatformDeals(platforms: PlatformFamilyId[]): Promise<GameSummary[]> {
  const mine = Map.groupBy(
    (await latestPrices()).filter((p) => offerFamilies(p.listing).some((f) => platforms.includes(f))),
    (p) => p.listing.gameId,
  );
  const onSale = [...mine].filter(([, offers]) => offers.some((o) => o.snapshot.discountPercent > 0));
  const rows: DealGame[] = [];
  for (let i = 0; i < onSale.length; i += 500) {
    rows.push(...(await db.select(dealGameColumns).from(games).where(inArray(games.id, onSale.slice(i, i + 500).map(([id]) => id)))));
  }
  const byId = new Map(rows.map((g) => [g.id, g]));
  return onSale.flatMap(([id, offers]) => {
    const game = byId.get(id);
    if (!game) return [];
    const best = offers.reduce((acc, o) => (compareOffers({ cents: o.snapshot.priceCents, store: o.listing.store }, { cents: acc.snapshot.priceCents, store: acc.listing.store }) < 0 ? o : acc));
    return [
      {
        game,
        bestPriceCents: best.snapshot.priceCents,
        regularPriceCents: best.snapshot.regularPriceCents,
        maxDiscount: Math.max(...offers.map((o) => o.snapshot.discountPercent)),
        storeCount: offers.length,
        bestStore: best.listing.store,
        bestPlatform: best.listing.platform,
        families: familiesOf(offers),
        stores: [...new Set(offers.map((o) => o.listing.store))],
      },
    ];
  });
}

/** Pré-vendas com desconto, do maior desconto para o menor, as mais próximas do lançamento primeiro no empate. */
export function pickPreorderDeals(pool: GameSummary[], limit: number): GameSummary[] {
  const now = new Date();
  return pool
    .filter((s) => s.maxDiscount > 0 && isUnreleased(s.game, now))
    .sort((a, b) => b.maxDiscount - a.maxDiscount || (parseReleaseDate(a.game.releaseDate)!.getTime() - parseReleaseDate(b.game.releaseDate)!.getTime()))
    .slice(0, limit);
}

/** No máximo um jogo por franquia nas vitrines; lista inteira (limite infinito) fica como está. */
function diversify(list: GameSummary[], limit: number): GameSummary[] {
  if (!Number.isFinite(limit)) return list;
  return onePerFranchise(list, limit, (s) => ({ title: s.game.title, developers: s.game.developers, publishers: s.game.publishers }));
}

/** Preço original mínimo (R$ 30) para um jogo contar como "quase de graça": evita o que já era barato. */
const MIN_REGULAR_CENTS = 3000;

/**
 * Jogos bons em promoção de menor preço (sem os grátis): nota mínima e preço original de pelo menos R$ 30,
 * do mais barato para o mais caro. Se faltarem jogos assim (poucas plataformas escolhidas), completa com os demais.
 */
export function pickCheapestDeals(pool: GameSummary[], limit: number): GameSummary[] {
  const onSale = pool.filter((s) => s.maxDiscount > 0 && (s.bestPriceCents ?? 0) > 0);
  const byPrice = (a: GameSummary, b: GameSummary) => a.bestPriceCents! - b.bestPriceCents! || b.maxDiscount - a.maxDiscount;
  const good = (s: GameSummary) => qualityOf(s.game) >= MIN_QUALITY && (s.regularPriceCents ?? 0) >= MIN_REGULAR_CENTS;
  const picked = diversify(onSale.filter(good).sort(byPrice), limit);
  if (picked.length >= limit) return picked;
  const rest = onSale.filter((s) => !good(s)).sort(byPrice);
  return [...picked, ...rest.slice(0, limit - picked.length)];
}

/**
 * "Jogo bom em ótimo preço": desconto de 30% ou mais, nota mínima e a melhor pontuação (preço perto do menor
 * histórico, qualidade, desconto, recência). Se faltarem jogos assim (poucas plataformas escolhidas), completa
 * com descontos a partir de 20%.
 */
export function pickFeaturedDeals(pool: GameSummary[], limit: number): GameSummary[] {
  const year = new Date().getFullYear();
  const now = new Date();
  const ranked = pool
    // pré-vendas têm seção própria
    .filter((s) => s.maxDiscount >= 20 && s.bestPriceCents !== 0 && !isUnreleased(s.game, now))
    .map((s) => ({ s, strong: s.maxDiscount >= 30 && qualityOf(s.game) >= MIN_QUALITY, score: featuredScore(s, year) }))
    .sort((a, b) => Number(b.strong) - Number(a.strong) || b.score - a.score || a.s.game.id - b.s.game.id);
  return diversify(ranked.map((x) => x.s), limit);
}

/**
 * Todas as promoções na ordem de relevância (a da home): os que "valem a pena" primeiro e, depois,
 * o resto (descontos pequenos, pré-vendas) do maior desconto para o menor.
 */
export function rankDeals(pool: GameSummary[]): GameSummary[] {
  const featured = pickFeaturedDeals(pool, Infinity);
  const shown = new Set(featured.map((s) => s.game.id));
  return [...featured, ...pool.filter((s) => !shown.has(s.game.id)).sort((a, b) => b.maxDiscount - a.maxDiscount)];
}

export type CatalogSort = "recentes" | "az";

/** Catálogo paginado. */
export async function getCatalog({ limit, offset = 0, sort = "recentes" }: { limit: number; offset?: number; sort?: CatalogSort }): Promise<Paged<GameSummary>> {
  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(games)
      .orderBy(sort === "az" ? asc(games.normalizedTitle) : desc(games.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: sql<number>`count(*)` }).from(games),
  ]);
  return { items: await summarize(rows), total };
}

export interface OfferRow {
  listing: Listing;
  snapshot: PriceSnapshot | null;
  /** Preço de venda (o mesmo da vitrine; já inclui o código da loja, se houver). */
  finalCents: number | null;
}

export interface HistoricLow {
  cents: number;
  date: Date | null;
  store: string | null;
}

/** Série do gráfico: pontos [timestamp ms, centavos], cada um vale até o próximo (degrau). */
export interface PriceSeries {
  store: string;
  points: [number, number][];
  /** Lojas sem histórico externo (consoles): desde quando nós registramos os preços. */
  trackedSince: number | null;
}

// `cache` do React: generateMetadata e a página pedem o mesmo jogo na mesma requisição e só uma consulta roda
export const getGamePage = cache(getGamePageUncached);

async function getGamePageUncached(slug: string) {
  const [game] = await db.select().from(games).where(eq(games.slug, slug));
  if (!game) return null;

  const [media, gameListings, latest, ownSnapshots, history] = await Promise.all([
    db.select().from(gameMedia).where(eq(gameMedia.gameId, game.id)).orderBy(asc(gameMedia.type), asc(gameMedia.position)),
    db.select().from(listings).where(and(eq(listings.gameId, game.id), eq(listings.available, true))),
    latestPrices([game.id]),
    db
      .select({ store: listings.store, priceCents: priceSnapshots.priceCents, at: priceSnapshots.capturedAt })
      .from(priceSnapshots)
      .innerJoin(listings, eq(listings.id, priceSnapshots.listingId))
      .where(and(eq(listings.gameId, game.id), eq(listings.available, true))),
    db
      .select({ store: priceHistory.store, priceCents: priceHistory.priceCents, at: priceHistory.recordedAt })
      .from(priceHistory)
      .where(eq(priceHistory.gameId, game.id)),
  ]);

  const stores = [...new Set(gameListings.map((l) => l.store))];
  const snapshotByListing = new Map(latest.map((p) => [p.listing.id, p.snapshot]));
  const offers: OfferRow[] = gameListings
    .map((listing) => {
      const snapshot = snapshotByListing.get(listing.id) ?? null;
      return { listing, snapshot, finalCents: snapshot?.priceCents ?? null };
    })
    .sort((a, b) => compareOffers({ cents: a.finalCents ?? Infinity, store: a.listing.store }, { cents: b.finalCents ?? Infinity, store: b.listing.store }));

  const lastChecked = gameListings.reduce<Date | null>(
    (acc, l) => (l.lastCheckedAt && (!acc || l.lastCheckedAt > acc) ? l.lastCheckedAt : acc),
    null,
  );

  // Histórico da ITAD (anos) + nossas coletas (recentes), só das lojas que vendem o jogo hoje
  const events = [...history, ...ownSnapshots].filter((e) => stores.includes(e.store));
  const series: PriceSeries[] = stores.map((store) => {
    const sorted = events.filter((e) => e.store === store).sort((a, b) => a.at.getTime() - b.at.getTime());
    const points: [number, number][] = [];
    for (const e of sorted) {
      if (points.at(-1)?.[1] !== e.priceCents) points.push([e.at.getTime(), e.priceCents]);
    }
    return { store, points, trackedSince: ITAD_HISTORY_STORES.has(store) || !sorted.length ? null : sorted[0].at.getTime() };
  });

  // Menor preço: o evento mais barato com data; a ITAD pode saber de um mais antigo que os 5 anos importados
  // jogos dados de graça numa promoção (ex.: Epic) aparecem como R$ 0 — brinde não é preço
  const isFreeGame = offers.every((o) => o.snapshot?.regularPriceCents === 0);
  const cheapest = events.filter((e) => isFreeGame || e.priceCents > 0).reduce<(typeof events)[number] | null>(
    (acc, e) => (!acc || e.priceCents < acc.priceCents || (e.priceCents === acc.priceCents && e.at > acc.at) ? e : acc),
    null,
  );
  let historicLow: HistoricLow | null = cheapest ? { cents: cheapest.priceCents, date: cheapest.at, store: cheapest.store } : null;
  if (game.historyLowCents != null && (!historicLow || game.historyLowCents < historicLow.cents)) {
    historicLow = { cents: game.historyLowCents, date: null, store: null };
  }

  return {
    game,
    similar: await resolveSimilarGames(game),
    screenshots: media.filter((m) => m.type === "screenshot"),
    videos: media.filter((m) => m.type === "video"),
    offers,
    historicLow,
    series,
    lastChecked,
    /** Momento da renderização — o gráfico estende as linhas até aqui. */
    generatedAt: Date.now(),
  };
}

export type GamePageData = NonNullable<Awaited<ReturnType<typeof getGamePage>>>;

export interface SimilarGameView extends SimilarGame {
  /** Preenchidos quando o jogo já está no catálogo. */
  slug: string | null;
  bestPriceCents: number | null;
  regularPriceCents: number | null;
  discountPercent: number;
}

/** Jogos parecidos (IGDB), marcando os que já estão no catálogo — esses vêm primeiro, com preço. */
async function resolveSimilarGames(game: Game): Promise<SimilarGameView[]> {
  const steamIds = game.similarGames.flatMap((s) => (s.steamAppId != null ? [s.steamAppId] : []));
  const igdbIds = game.similarGames.map((s) => s.igdbId);
  // por appid da Steam ou pelo id do IGDB (os exclusivos de console não têm appid)
  const inCatalog = await db
    .select({ id: games.id, slug: games.slug, steamAppId: games.steamAppId, igdbId: games.igdbId })
    .from(games)
    .where(or(steamIds.length ? inArray(games.steamAppId, steamIds) : undefined, igdbIds.length ? inArray(games.igdbId, igdbIds) : undefined));
  const prices = inCatalog.length ? Map.groupBy(await latestPrices(inCatalog.map((g) => g.id)), (p) => p.listing.gameId) : new Map();

  return game.similarGames
    .map((s) => {
      const match = inCatalog.find((g) => (s.steamAppId != null && g.steamAppId === s.steamAppId) || g.igdbId === s.igdbId);
      const offers: { snapshot: PriceSnapshot }[] = match ? (prices.get(match.id) ?? []) : [];
      // a melhor oferta é a mais barata; o desconto e o preço cheio vêm dela
      const best = offers.reduce<PriceSnapshot | null>((acc, o) => (!acc || o.snapshot.priceCents < acc.priceCents ? o.snapshot : acc), null);
      return {
        ...s,
        slug: match?.slug ?? null,
        bestPriceCents: best?.priceCents ?? null,
        regularPriceCents: best?.regularPriceCents ?? null,
        discountPercent: best?.discountPercent ?? 0,
      };
    })
    .sort((a, b) => Number(b.slug != null) - Number(a.slug != null));
}
