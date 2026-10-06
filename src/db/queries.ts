import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { bestByFamily, type BestPrice, type FamilyKey, type PricedOffer } from "@/lib/best-by-family";
import { ITAD_HISTORY_STORES } from "@/collectors/itad";
import { parseReleaseDate } from "@/lib/release-date";
import { applyBestCoupon, type CouponResult } from "@/lib/pricing";
import { compareOffers, offerFamilies, type PlatformFamilyId } from "@/lib/stores";
import { normalizeTitle } from "@/lib/text";
import { db } from ".";
import {
  coupons,
  gameMedia,
  games,
  listings,
  priceHistory,
  priceSnapshots,
  type Game,
  type Listing,
  type PriceSnapshot,
  type SimilarGame,
} from "./schema";

/** Último snapshot de cada listagem (os ids são crescentes, então o maior id é o mais recente). */
const latestSnapshotIds = db
  .select({ id: sql<number>`max(${priceSnapshots.id})`.as("id") })
  .from(priceSnapshots)
  .groupBy(priceSnapshots.listingId);

async function latestPrices(gameIds?: number[]) {
  return db
    .select({ listing: listings, snapshot: priceSnapshots })
    .from(priceSnapshots)
    .innerJoin(listings, eq(listings.id, priceSnapshots.listingId))
    .where(
      and(
        inArray(priceSnapshots.id, latestSnapshotIds),
        eq(listings.available, true),
        gameIds ? inArray(listings.gameId, gameIds) : undefined,
      ),
    );
}

export interface GameSummary {
  game: Game;
  bestPriceCents: number | null;
  regularPriceCents: number | null;
  maxDiscount: number;
  storeCount: number;
  bestStore: string | null;
}

async function summarize(rows: Game[]): Promise<GameSummary[]> {
  if (!rows.length) return [];
  const prices = Map.groupBy(await latestPrices(rows.map((g) => g.id)), (p) => p.listing.gameId);
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
      maxDiscount: sql<number>`max(${priceSnapshots.discountPercent})`.as("max_discount"),
      bestPrice: sql<number>`min(${priceSnapshots.priceCents})`.as("best_price"),
    })
    .from(priceSnapshots)
    .innerJoin(listings, eq(listings.id, priceSnapshots.listingId))
    .where(and(inArray(priceSnapshots.id, latestSnapshotIds), eq(listings.available, true)))
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

  const rows = await db.select().from(games).where(inArray(games.id, ranked.map((r) => r.gameId)));
  const byId = new Map(rows.map((g) => [g.id, g]));
  return { items: await summarize(ranked.flatMap((r) => byId.get(r.gameId) ?? [])), total };
}

/** Ano do campo de texto de lançamento da Steam ("13/dez./2022", "Q2 2025"…). */
function releaseYear(text: string | null): number | null {
  const m = text?.match(/\b(?:19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

/**
 * Pontuação de destaque: jogos recentes e bem avaliados com desconto de verdade. O desconto só
 * desempata — o objetivo é mostrar o que vale a pena, não só o que está mais barato.
 */
function featuredScore(s: GameSummary, year: number): number {
  const { game } = s;
  const rating = game.criticRating ?? game.metacritic;
  // nota com pouca crítica pesa menos; sem nota, fica abaixo da média
  const trust = Math.min(1, (game.criticRatingCount ?? (game.metacritic ? 5 : 0)) / 5);
  const quality = rating != null ? 60 + (rating - 60) * trust : 55;
  const released = releaseYear(game.releaseDate);
  const age = released == null ? 8 : Math.max(0, year - released);
  const recency = age <= 1 ? 45 : age <= 2 ? 32 : age <= 4 ? 16 : age <= 7 ? 6 : 0;
  return quality + recency + Math.min(s.maxDiscount, 80) / 10;
}

/** Ainda não lançado (o dia do lançamento já conta como lançado). */
function isUnreleased(game: Game, now: Date): boolean {
  const date = parseReleaseDate(game.releaseDate);
  return date != null && date > now;
}

/** Todos os jogos em promoção, para a home escolher destaques e pré-vendas sem repetir consultas. */
const poolCache = new Map<string, { at: number; pool: Promise<GameSummary[]> }>();
const POOL_TTL_MS = 5 * 60_000;

/**
 * Todos os jogos em promoção. Com `platforms`, só contam as ofertas das plataformas escolhidas (o
 * preço, o desconto e a loja de cada jogo vêm só delas) e só entram jogos com desconto nelas.
 */
export function getDealPool(platforms: PlatformFamilyId[] = []): Promise<GameSummary[]> {
  // a página de ofertas é dinâmica; sem isso cada acesso refaria o ranking inteiro
  const key = platforms.join("-");
  const cached = poolCache.get(key);
  if (cached && Date.now() - cached.at < POOL_TTL_MS) return cached.pool;
  const pool = platforms.length ? getPlatformDeals(platforms) : getDeals({ limit: 2000 }).then((r) => r.items);
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
  const rows: Game[] = [];
  for (let i = 0; i < onSale.length; i += 500) {
    rows.push(...(await db.select().from(games).where(inArray(games.id, onSale.slice(i, i + 500).map(([id]) => id)))));
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

/** Os jogos em promoção de menor preço (sem os grátis), do mais barato para o mais caro. */
export function pickCheapestDeals(pool: GameSummary[], limit: number): GameSummary[] {
  return pool
    .filter((s) => s.maxDiscount > 0 && (s.bestPriceCents ?? 0) > 0)
    .sort((a, b) => a.bestPriceCents! - b.bestPriceCents! || b.maxDiscount - a.maxDiscount)
    .slice(0, limit);
}

/** Jogos recentes e relevantes com desconto (a partir de 20%), do mais ao menos "vale a pena". */
export function pickFeaturedDeals(pool: GameSummary[], limit: number): GameSummary[] {
  const year = new Date().getFullYear();
  const now = new Date();
  return pool
    // pré-vendas têm seção própria
    .filter((s) => s.maxDiscount >= 20 && s.bestPriceCents !== 0 && !isUnreleased(s.game, now))
    .map((s) => ({ s, score: featuredScore(s, year) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
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
  coupon: CouponResult | null;
  /** Preço final já com o melhor cupom aplicado. */
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

export async function getGamePage(slug: string) {
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
  const activeCoupons = stores.length
    ? await db.select().from(coupons).where(and(inArray(coupons.store, stores), eq(coupons.active, true)))
    : [];

  const snapshotByListing = new Map(latest.map((p) => [p.listing.id, p.snapshot]));
  const now = new Date();
  const offers: OfferRow[] = gameListings
    .map((listing) => {
      const snapshot = snapshotByListing.get(listing.id) ?? null;
      if (!snapshot) return { listing, snapshot, coupon: null, finalCents: null };
      // o preço já inclui o voucher da loja; outro cupom por cima seria desconto em dobro
      if (listing.voucher) return { listing, snapshot, coupon: null, finalCents: snapshot.priceCents };
      const coupon = applyBestCoupon(
        { store: listing.store, priceCents: snapshot.priceCents, discountPercent: snapshot.discountPercent },
        activeCoupons,
        now,
      );
      return { listing, snapshot, coupon: coupon.coupon ? coupon : null, finalCents: coupon.finalCents };
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
    generatedAt: now.getTime(),
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
