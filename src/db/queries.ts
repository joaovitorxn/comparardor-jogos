import { and, asc, desc, eq, inArray, like, sql } from "drizzle-orm";
import { bestByFamily, type BestPrice, type FamilyKey, type PricedOffer } from "@/lib/best-by-family";
import { applyBestCoupon, type CouponResult } from "@/lib/pricing";
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
      (acc, o) => (!acc || o.snapshot.priceCents < acc.snapshot.priceCents ? o : acc),
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

/** Jogos com desconto em alguma loja, do maior desconto para o menor — sobre o catálogo inteiro. */
export async function getDeals({ limit, offset = 0 }: { limit: number; offset?: number }): Promise<Paged<GameSummary>> {
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

  const [ranked, [{ total }]] = await Promise.all([
    db
      .select({ gameId: perGame.gameId })
      .from(perGame)
      .where(sql`${perGame.maxDiscount} > 0`)
      .orderBy(desc(perGame.maxDiscount), asc(perGame.bestPrice))
      .limit(limit)
      .offset(offset),
    db.select({ total: sql<number>`count(*)` }).from(perGame).where(sql`${perGame.maxDiscount} > 0`),
  ]);
  if (!ranked.length) return { items: [], total };

  const rows = await db.select().from(games).where(inArray(games.id, ranked.map((r) => r.gameId)));
  const byId = new Map(rows.map((g) => [g.id, g]));
  return { items: await summarize(ranked.flatMap((r) => byId.get(r.gameId) ?? [])), total };
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
    .sort((a, b) => (a.finalCents ?? Infinity) - (b.finalCents ?? Infinity));

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
    return { store, points };
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
}

/** Jogos parecidos (IGDB), marcando os que já estão no catálogo — esses vêm primeiro, com preço. */
async function resolveSimilarGames(game: Game): Promise<SimilarGameView[]> {
  const steamIds = game.similarGames.flatMap((s) => (s.steamAppId != null ? [s.steamAppId] : []));
  const inCatalog = steamIds.length
    ? await db.select({ id: games.id, slug: games.slug, steamAppId: games.steamAppId }).from(games).where(inArray(games.steamAppId, steamIds))
    : [];
  const prices = inCatalog.length ? Map.groupBy(await latestPrices(inCatalog.map((g) => g.id)), (p) => p.listing.gameId) : new Map();

  return game.similarGames
    .map((s) => {
      const match = inCatalog.find((g) => g.steamAppId === s.steamAppId);
      const offers: { snapshot: PriceSnapshot }[] = match ? (prices.get(match.id) ?? []) : [];
      return {
        ...s,
        slug: match?.slug ?? null,
        bestPriceCents: offers.length ? Math.min(...offers.map((o) => o.snapshot.priceCents)) : null,
      };
    })
    .sort((a, b) => Number(b.slug != null) - Number(a.slug != null));
}
