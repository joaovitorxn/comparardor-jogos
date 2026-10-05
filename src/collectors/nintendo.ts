import type { Platform } from "@/db/schema";
import { fetchJson } from "./http";
import type { OfferPrice, StoreCollector, StoreOffer } from "./types";

/**
 * Nintendo eShop (Brasil).
 * - Busca: o mesmo índice que a busca do nintendo.com/pt-br usa (chave pública, só leitura).
 * - Preços: API do eShop por nsuid (o Brasil usa os nsuids das Américas), até 50 por chamada.
 */
const SEARCH_URL = "https://U3B6GR4UA3-dsn.algolia.net/1/indexes/store_game_pt_br/query";
const SEARCH_HEADERS = {
  "X-Algolia-Application-Id": "U3B6GR4UA3",
  "X-Algolia-API-Key": "a29c6927638bfd8cee23993e51e721c9",
  "Content-Type": "application/json",
};
const PRICE_URL = "https://api.ec.nintendo.com/v1/price";

interface SearchHit {
  nsuid?: string;
  title: string;
  platformCode?: string;
  url?: string;
}

interface PriceEntry {
  title_id: number;
  sales_status: string;
  regular_price?: { raw_value: string; currency: string };
  discount_price?: { raw_value: string; currency: string; end_datetime?: string };
}

const PLATFORMS: Record<string, Platform> = { NINTENDO_SWITCH: "switch", NINTENDO_SWITCH_2: "switch2" };
const cents = (raw: string) => Math.round(Number(raw) * 100);

export function parseNintendoPrice(p: PriceEntry): OfferPrice | null {
  if (p.sales_status !== "onsale" || !p.regular_price || p.regular_price.currency !== "BRL") return null;
  const regular = cents(p.regular_price.raw_value);
  const final = p.discount_price ? cents(p.discount_price.raw_value) : regular;
  return { currency: "BRL", priceCents: final, regularPriceCents: regular, discountPercent: regular > 0 ? Math.round((1 - final / regular) * 100) : 0 };
}

export async function fetchNintendoPrices(nsuids: string[]): Promise<Map<string, OfferPrice | null>> {
  const result = new Map<string, OfferPrice | null>();
  for (let i = 0; i < nsuids.length; i += 50) {
    const batch = nsuids.slice(i, i + 50);
    const res = await fetchJson<{ prices?: PriceEntry[] }>(`${PRICE_URL}?country=BR&lang=pt&ids=${batch.join(",")}`);
    for (const id of batch) result.set(id, null);
    for (const p of res.prices ?? []) result.set(String(p.title_id), parseNintendoPrice(p));
  }
  return result;
}

export const nintendoCollector: StoreCollector = {
  store: "nintendo",

  async findByTitle(title) {
    const res = await fetchJson<{ hits: SearchHit[] }>(SEARCH_URL, {
      init: {
        method: "POST",
        headers: SEARCH_HEADERS,
        body: JSON.stringify({ query: title, hitsPerPage: 10, filters: "topLevelCategoryCode:GAMES" }),
      },
    });
    const hits = res.hits.filter((h): h is SearchHit & { nsuid: string } => !!h.nsuid && !!PLATFORMS[h.platformCode ?? ""]);
    const prices = hits.length ? await fetchNintendoPrices(hits.map((h) => h.nsuid)) : new Map();

    return hits.map(
      (h): StoreOffer => ({
        store: "nintendo",
        storeProductId: h.nsuid,
        title: h.title,
        platform: PLATFORMS[h.platformCode!],
        drm: "console",
        isKey: false,
        url: h.url ? `https://www.nintendo.com${h.url}` : "https://www.nintendo.com/pt-br/store/",
        price: prices.get(h.nsuid) ?? null,
      }),
    );
  },

  fetchPrices: fetchNintendoPrices,
};
