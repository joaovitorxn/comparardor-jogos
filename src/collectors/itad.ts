import type { StoreId } from "@/lib/stores";
import { fetchJson } from "./http";
import type { StoreOffer } from "./types";

/**
 * IsThereAnyDeal — agrega várias lojas de PC numa API só. Usamos para as lojas sem
 * coletor próprio; Steam e GOG entram no pedido só para o menor preço histórico.
 * Docs: https://docs.isthereanydeal.com/
 */
const API = "https://api.isthereanydeal.com";

/** IDs de loja da ITAD → nossas lojas. */
const ITAD_SHOPS: Record<number, StoreId> = {
  16: "epic",
  50: "nuuvem",
  36: "gmg",
  48: "msstore", // Microsoft Store (versão PC; a de console vem do coletor da Xbox)
};
const STEAM_SHOP = 61;
const GOG_SHOP = 35;

/** Lojas cujas ofertas vêm da ITAD (as outras têm coletor direto). */
export const ITAD_STORES = new Set<string>(Object.values(ITAD_SHOPS));

/** Revendedoras vendem chaves de outra plataforma. */
const RESELLERS = new Set<StoreId>(["nuuvem", "gmg"]);

/** DRM informado pela ITAD → nosso campo `drm`. */
const DRM_MAP: Record<number, string> = { 61: "steam", 16: "epic", 1000: "gog", 35: "gog", 48: "microsoft" };

interface ItadMoney {
  amountInt: number;
  currency: string;
}

interface ItadDeal {
  shop: { id: number; name: string };
  price: ItadMoney;
  regular: ItadMoney;
  cut: number;
  voucher: string | null;
  drm: { id: number; name: string }[];
  url: string;
}

interface ItadPrices {
  id: string;
  historyLow: { all: ItadMoney | null } | null;
  deals: ItadDeal[];
}

export interface ItadGamePrices {
  itadId: string;
  historyLowCents: number | null;
  offers: StoreOffer[];
}

function apiKey() {
  const key = process.env.ITAD_API_KEY;
  if (!key) throw new Error("ITAD_API_KEY não configurada no .env");
  return key;
}

export function isItadConfigured() {
  return Boolean(process.env.ITAD_API_KEY);
}

async function post<T>(path: string, params: Record<string, string>, body: unknown): Promise<T> {
  const qs = new URLSearchParams({ key: apiKey(), ...params });
  return fetchJson<T>(`${API}${path}?${qs}`, {
    init: { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  });
}

/** appid da Steam → id do jogo na ITAD (null quando a ITAD não conhece o jogo). */
export async function lookupItadIds(steamAppIds: number[]): Promise<Map<number, string | null>> {
  const result = new Map<number, string | null>();
  for (let i = 0; i < steamAppIds.length; i += 200) {
    const batch = steamAppIds.slice(i, i + 200);
    const res = await post<Record<string, string | null>>(
      `/lookup/id/shop/${STEAM_SHOP}/v1`,
      {},
      batch.map((id) => `app/${id}`),
    );
    for (const id of batch) result.set(id, res[`app/${id}`] ?? null);
  }
  return result;
}

function toOffer(itadId: string, store: StoreId, deal: ItadDeal): StoreOffer {
  const drmId = deal.drm[0]?.id;
  return {
    store,
    // um registro por jogo e loja (ficamos com a oferta mais barata)
    storeProductId: `itad:${itadId}`,
    title: "",
    platform: "pc",
    drm: drmId != null ? (DRM_MAP[drmId] ?? deal.drm[0].name.toLowerCase()) : store === "msstore" ? "microsoft" : null,
    isKey: RESELLERS.has(store),
    url: deal.url,
    voucher: deal.voucher,
    price: {
      currency: deal.price.currency,
      priceCents: deal.price.amountInt,
      regularPriceCents: deal.regular.amountInt,
      discountPercent: deal.cut,
    },
  };
}

/**
 * Jogos mais populares na ITAD (mais colecionados/acompanhados), convertidos para appids
 * da Steam. Usado para pré-carregar o catálogo.
 */
export async function fetchPopularSteamAppIds(limit: number): Promise<number[]> {
  const popular: string[] = [];
  for (let offset = 0; popular.length < limit; offset += 500) {
    const qs = new URLSearchParams({ key: apiKey(), limit: "500", offset: String(offset) });
    const page = await fetchJson<{ id: string; type: string | null }[]>(`${API}/stats/most-popular/v1?${qs}`);
    if (!page.length) break;
    popular.push(...page.filter((g) => g.type === "game").map((g) => g.id));
  }

  const appIds: number[] = [];
  const ids = popular.slice(0, limit);
  for (let i = 0; i < ids.length; i += 200) {
    const res = await post<Record<string, string[] | null>>(`/lookup/shop/${STEAM_SHOP}/id/v1`, {}, ids.slice(i, i + 200));
    for (const id of ids.slice(i, i + 200)) {
      // um jogo pode ter vários pacotes ("sub/..."); queremos o app
      const app = res[id]?.find((s) => s.startsWith("app/"));
      if (app) appIds.push(Number(app.slice(4)));
    }
  }
  return appIds;
}

/** Todas as lojas que comparamos, inclusive as de coletor direto — o histórico usa todas. */
const HISTORY_SHOPS: Record<number, StoreId> = { ...ITAD_SHOPS, [STEAM_SHOP]: "steam", [GOG_SHOP]: "gog" };

export interface ItadHistoryEntry {
  store: StoreId;
  priceCents: number;
  regularPriceCents: number;
  discountPercent: number;
  recordedAt: Date;
}

/** Mudanças de preço de um jogo desde `since` (a ITAD devolve só os últimos meses sem esse parâmetro). */
export async function fetchItadHistory(itadId: string, since: Date): Promise<ItadHistoryEntry[]> {
  const qs = new URLSearchParams({
    key: apiKey(),
    id: itadId,
    country: "BR",
    shops: Object.keys(HISTORY_SHOPS).join(","),
    // a API rejeita (400) datas com milissegundos
    since: since.toISOString().replace(/\.\d{3}Z$/, "Z"),
  });
  const res = await fetchJson<{ timestamp: string; shop: { id: number }; deal: { price: ItadMoney; regular: ItadMoney; cut: number } }[]>(
    `${API}/games/history/v2?${qs}`,
  );
  return res.flatMap((e) => {
    const store = HISTORY_SHOPS[e.shop.id];
    if (!store || e.deal.price.currency !== "BRL") return [];
    return [
      {
        store,
        priceCents: e.deal.price.amountInt,
        regularPriceCents: e.deal.regular.amountInt,
        discountPercent: e.deal.cut,
        recordedAt: new Date(e.timestamp),
      },
    ];
  });
}

export async function fetchItadPrices(itadIds: string[]): Promise<ItadGamePrices[]> {
  const shops = [...Object.keys(ITAD_SHOPS), STEAM_SHOP, GOG_SHOP].join(",");
  const result: ItadGamePrices[] = [];

  for (let i = 0; i < itadIds.length; i += 100) {
    const res = await post<ItadPrices[]>(
      "/games/prices/v3",
      { country: "BR", shops, deals: "false", vouchers: "true" },
      itadIds.slice(i, i + 100),
    );
    for (const game of res) {
      const cheapest = new Map<StoreId, ItadDeal>();
      for (const deal of game.deals) {
        const store = ITAD_SHOPS[deal.shop.id];
        if (!store || deal.price.currency !== "BRL") continue;
        const current = cheapest.get(store);
        if (!current || deal.price.amountInt < current.price.amountInt) cheapest.set(store, deal);
      }
      result.push({
        itadId: game.id,
        historyLowCents: game.historyLow?.all?.currency === "BRL" ? game.historyLow.all.amountInt : null,
        offers: [...cheapest].map(([store, deal]) => toOffer(game.id, store, deal)),
      });
    }
  }
  return result;
}
