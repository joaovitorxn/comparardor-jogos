import { sql } from "drizzle-orm";
import type { GameLanguage } from "@/lib/languages";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export interface RequirementItem {
  /** "Processador", "Memória"... — null para linhas soltas ("Requer 64 bits"). */
  label: string | null;
  value: string;
}

export interface PcRequirements {
  minimum: RequirementItem[];
  recommended: RequirementItem[];
}

/** Tempo para zerar (IGDB), em segundos. */
export interface TimeToBeat {
  hastily: number | null;
  normally: number | null;
  completely: number | null;
  /** Quantas pessoas informaram o tempo. */
  count: number;
}

export interface SimilarGame {
  igdbId: number;
  name: string;
  coverImageId: string | null;
  steamAppId: number | null;
}

/** IDs do jogo em outras lojas, vindos do IGDB — base para os coletores de console. */
export interface ExternalIds {
  gog?: string;
  epic?: string[];
  xbox?: string[];
  psstore?: string[];
}

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
};

/** Jogo canônico — uma linha por jogo, independente de loja/plataforma. */
export const games = sqliteTable(
  "games",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    normalizedTitle: text("normalized_title").notNull(),
    shortDescription: text("short_description"),
    developers: text("developers", { mode: "json" }).$type<string[]>().notNull().default([]),
    publishers: text("publishers", { mode: "json" }).$type<string[]>().notNull().default([]),
    genres: text("genres", { mode: "json" }).$type<string[]>().notNull().default([]),
    releaseDate: text("release_date"),
    coverUrl: text("cover_url"),
    headerUrl: text("header_url"),
    backgroundUrl: text("background_url"),
    metacritic: integer("metacritic"),
    website: text("website"),
    steamAppId: integer("steam_app_id"),
    igdbId: integer("igdb_id"),
    itadId: text("itad_id"),
    /** Menor preço já registrado pela IsThereAnyDeal no Brasil, entre as lojas que comparamos. */
    historyLowCents: integer("history_low_cents"),
    historySyncedAt: integer("history_synced_at", { mode: "timestamp" }),
    requirements: text("requirements", { mode: "json" }).$type<PcRequirements | null>(),
    /** Idiomas da Steam (com dublagem marcada). Null = ainda não consultado; lista vazia = o jogo não informa. */
    languages: text("languages", { mode: "json" }).$type<GameLanguage[] | null>(),
    // --- IGDB ---
    igdbSyncedAt: integer("igdb_synced_at", { mode: "timestamp" }),
    /** Steam Deck, segundo a Valve: 3 = Verificado, 2 = Jogável, 1 = Não suportado, 0 = ainda sem análise. Null = não consultado. */
    deckStatus: integer("deck_status"),
    deckCheckedAt: integer("deck_checked_at", { mode: "timestamp" }),
    /** Avaliações dos jogadores na Steam: % de positivas (0–100) e quantas avaliações. Null = ainda não consultado ou sem avaliações. */
    userScore: integer("user_score"),
    userReviewCount: integer("user_review_count"),
    userReviewsCheckedAt: integer("user_reviews_checked_at", { mode: "timestamp" }),
    platforms: text("platforms", { mode: "json" }).$type<string[]>().notNull().default([]),
    gameModes: text("game_modes", { mode: "json" }).$type<string[]>().notNull().default([]),
    themes: text("themes", { mode: "json" }).$type<string[]>().notNull().default([]),
    perspectives: text("perspectives", { mode: "json" }).$type<string[]>().notNull().default([]),
    /** Média da crítica especializada (0–100) e quantas críticas entraram nela. */
    criticRating: integer("critic_rating"),
    criticRatingCount: integer("critic_rating_count"),
    timeToBeat: text("time_to_beat", { mode: "json" }).$type<TimeToBeat | null>(),
    similarGames: text("similar_games", { mode: "json" }).$type<SimilarGame[]>().notNull().default([]),
    externalIds: text("external_ids", { mode: "json" }).$type<ExternalIds>().notNull().default({}),
    /**
     * Quando terminamos de buscar o jogo nas outras lojas (IGDB, GOG, ITAD). Fica null logo
     * depois da importação pela busca, enquanto isso roda em segundo plano.
     */
    enrichedAt: integer("enriched_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("games_slug_idx").on(t.slug),
    uniqueIndex("games_steam_app_id_idx").on(t.steamAppId),
    index("games_normalized_title_idx").on(t.normalizedTitle),
    index("games_igdb_id_idx").on(t.igdbId),
  ],
);

export const gameMedia = sqliteTable(
  "game_media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["screenshot", "video"] }).notNull(),
    url: text("url").notNull(),
    thumbUrl: text("thumb_url"),
    title: text("title"),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("game_media_game_idx").on(t.gameId)],
);

/** Um produto específico numa loja (jogo + loja + plataforma + edição). */
export const listings = sqliteTable(
  "listings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    store: text("store").notNull(),
    storeProductId: text("store_product_id").notNull(),
    title: text("title").notNull(),
    platform: text("platform", { enum: ["pc", "ps5", "ps4", "xbox", "switch", "switch2"] }).notNull(),
    edition: text("edition").notNull().default("Padrão"),
    /** Onde o jogo é ativado: steam, gog (sem DRM), epic, console... */
    drm: text("drm"),
    /** true quando a loja revende uma chave de outra plataforma (ex.: Nuuvem vendendo key Steam). */
    isKey: integer("is_key", { mode: "boolean" }).notNull().default(false),
    url: text("url").notNull(),
    /** false quando a loja parou de vender — mantemos a linha para não perder o histórico. */
    available: integer("available", { mode: "boolean" }).notNull().default(true),
    /** Código de voucher exigido pela oferta atual; o preço do snapshot já o inclui. */
    voucher: text("voucher"),
    lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }),
    // Preço atual, copiado do último snapshot (price_snapshots guarda o histórico). Assim as listas e a busca leem só
    // esta tabela, em vez de procurar o último snapshot de cada oferta. Nulo = ainda sem preço.
    priceSnapshotId: integer("price_snapshot_id"),
    priceCurrency: text("price_currency"),
    priceCents: integer("price_cents"),
    priceRegularCents: integer("price_regular_cents"),
    priceDiscountPercent: integer("price_discount_percent"),
    priceCapturedAt: integer("price_captured_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("listings_store_product_idx").on(t.store, t.storeProductId),
    index("listings_game_idx").on(t.gameId),
  ],
);

/** Histórico de preços. Só gravamos um snapshot novo quando o preço muda. */
export const priceSnapshots = sqliteTable(
  "price_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    listingId: integer("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    currency: text("currency").notNull(),
    priceCents: integer("price_cents").notNull(),
    regularPriceCents: integer("regular_price_cents").notNull(),
    discountPercent: integer("discount_percent").notNull().default(0),
    capturedAt: integer("captured_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("price_snapshots_listing_idx").on(t.listingId, t.capturedAt)],
);

/**
 * Histórico de longo prazo importado da IsThereAnyDeal: cada linha é uma mudança de
 * preço numa loja. Fica separado de `price_snapshots`, que são as nossas próprias coletas.
 */
export const priceHistory = sqliteTable(
  "price_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    store: text("store").notNull(),
    priceCents: integer("price_cents").notNull(),
    regularPriceCents: integer("regular_price_cents").notNull(),
    discountPercent: integer("discount_percent").notNull().default(0),
    recordedAt: integer("recorded_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [uniqueIndex("price_history_unique_idx").on(t.gameId, t.store, t.recordedAt)],
);

/**
 * Inscrição de notificações push de um navegador. Não há conta: o próprio endpoint
 * (longo e impossível de adivinhar) identifica o aparelho.
 */
export const pushSubscriptions = sqliteTable(
  "push_subscriptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("push_subscriptions_endpoint_idx").on(t.endpoint)],
);

export const priceAlerts = sqliteTable(
  "price_alerts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    subscriptionId: integer("subscription_id")
      .notNull()
      .references(() => pushSubscriptions.id, { onDelete: "cascade" }),
    gameId: integer("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    /** "target": preço escolhido pela pessoa; "sale": qualquer preço abaixo do de quando o alerta foi criado. */
    kind: text("kind", { enum: ["target", "sale"] }).notNull(),
    /** Plataforma acompanhada ("pc", "playstation", "xbox", "nintendo"); null = qualquer uma. */
    platformFamily: text("platform_family", { enum: ["pc", "playstation", "xbox", "nintendo"] }),
    /** Avisa quando o menor preço ficar igual ou abaixo deste valor. */
    thresholdCents: integer("threshold_cents").notNull(),
    /** Menor preço quando o alerta foi criado (para mostrar a economia). */
    baselineCents: integer("baseline_cents").notNull(),
    /** Preço do último aviso; volta a null quando o preço sobe acima do alvo (rearma o alerta). */
    lastNotifiedCents: integer("last_notified_cents"),
    lastNotifiedAt: integer("last_notified_at", { mode: "timestamp" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("price_alerts_sub_game_idx").on(t.subscriptionId, t.gameId), index("price_alerts_game_idx").on(t.gameId)],
);

export const coupons = sqliteTable(
  "coupons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    store: text("store").notNull(),
    /** null = desconto automático (ex.: VIP da GMG), sem código para digitar. */
    code: text("code"),
    description: text("description").notNull(),
    kind: text("kind", { enum: ["percent", "fixed"] }).notNull(),
    /** Percentual (10 = 10%) ou valor fixo em centavos. */
    value: integer("value").notNull(),
    minPurchaseCents: integer("min_purchase_cents"),
    maxDiscountCents: integer("max_discount_cents"),
    /** Se o cupom vale para jogos que já estão em promoção. */
    stacksWithSale: integer("stacks_with_sale", { mode: "boolean" }).notNull().default(true),
    startsAt: integer("starts_at", { mode: "timestamp" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sourceUrl: text("source_url"),
    ...timestamps,
  },
  (t) => [index("coupons_store_idx").on(t.store)],
);

export type Game = typeof games.$inferSelect;
export type GameMedia = typeof gameMedia.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type PriceSnapshot = typeof priceSnapshots.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type PriceHistoryEntry = typeof priceHistory.$inferSelect;
export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type PriceAlert = typeof priceAlerts.$inferSelect;
export type Platform = Listing["platform"];

/** Visitantes com o site aberto: cada aba avisa que está viva de tempos em tempos (sem dados pessoais). */
export const presence = sqliteTable(
  "presence",
  {
    id: text("id").primaryKey(),
    seenAt: integer("seen_at", { mode: "timestamp" }).notNull(),
  },
  (t) => [index("presence_seen_at_idx").on(t.seenAt)],
);

/** Mensagens enviadas pelo botão de feedback do site. */
export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["bug", "sugestao", "elogio", "outro"] }).notNull(),
  message: text("message").notNull(),
  /** E-mail ou @ que a pessoa quis deixar para resposta (opcional). */
  contact: text("contact"),
  page: text("page"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Cliques nos links que levam a uma loja (comprar, gift card, produto do Setup). Só o que foi clicado e a página,
 * sem IP nem identificador de quem clicou: serve para saber quanto cada tipo de link rende.
 */
export const clicks = sqliteTable(
  "clicks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["buy", "giftcard", "setup"] }).notNull(),
    /** Loja do link (steam, nuuvem…, mercadolivre, amazon). */
    store: text("store"),
    /** Jogo da página (links de compra) ou produto/console clicado (Gift Card e Setup). */
    gameId: integer("game_id"),
    target: text("target"),
    page: text("page"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (t) => [index("clicks_created_idx").on(t.createdAt), index("clicks_kind_idx").on(t.kind)],
);

/**
 * Exclusivos de console que já tentamos importar e não tinham preço nas nossas lojas (ou não são
 * jogos vendáveis hoje): evita repetir a tentativa a cada atualização.
 */
export const skippedGames = sqliteTable("skipped_games", {
  igdbId: integer("igdb_id").primaryKey(),
  reason: text("reason").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
