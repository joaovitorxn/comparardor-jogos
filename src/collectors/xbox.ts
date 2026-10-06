import { PLAY_ANYWHERE } from "@/lib/stores";
import { normalizeTitle, slugify } from "@/lib/text";
import { fetchJson } from "./http";
import type { OfferPrice, StoreCollector, StoreOffer } from "./types";

/**
 * Loja Xbox / Microsoft Store pelo catálogo público da Microsoft (o mesmo que o site da Xbox usa).
 * Os produtos são encontrados pelos ids que o IGDB informa ("bigIds", ex.: 9P8DL6W0JBB8).
 */
const CATALOG = "https://displaycatalog.mp.microsoft.com/v7.0/products";

interface Availability {
  Actions?: string[];
  Conditions?: { ClientConditions?: { AllowedPlatforms?: { PlatformName: string }[] } };
  OrderManagementData?: { Price?: { CurrencyCode: string; ListPrice: number; MSRP: number } };
  /** Entradas com "remediations" são de assinatura/resgate (ex.: Game Pass), não de compra. */
  Remediations?: unknown[];
}

interface CatalogProduct {
  ProductId: string;
  ProductType: string;
  LocalizedProperties: { ProductTitle: string }[];
  DisplaySkuAvailabilities: {
    Sku: { Properties?: { IsTrial?: boolean } };
    Availabilities: Availability[];
  }[];
}

export interface XboxProduct {
  offer: StoreOffer;
  /** Comprar na Xbox também libera a versão de PC (Xbox Play Anywhere). */
  playAnywhere: boolean;
}

/** Escolhe a oferta de compra (com preço) de um produto do catálogo. */
export function parseXboxProduct(p: CatalogProduct): XboxProduct | null {
  if (p.ProductType !== "Game") return null;
  let best: { price: OfferPrice; platforms: string[] } | null = null;

  for (const sku of p.DisplaySkuAvailabilities) {
    if (sku.Sku.Properties?.IsTrial) continue;
    for (const a of sku.Availabilities) {
      const price = a.OrderManagementData?.Price;
      if (!price || price.CurrencyCode !== "BRL" || !a.Actions?.includes("Purchase") || a.Remediations?.length) continue;
      const platforms = (a.Conditions?.ClientConditions?.AllowedPlatforms ?? []).map((x) => x.PlatformName);
      if (!platforms.includes("Windows.Xbox")) continue;
      const priceCents = Math.round(price.ListPrice * 100);
      const regularPriceCents = Math.round(Math.max(price.MSRP, price.ListPrice) * 100);
      if (!best || priceCents < best.price.priceCents) {
        best = {
          price: {
            currency: "BRL",
            priceCents,
            regularPriceCents,
            discountPercent: regularPriceCents > 0 ? Math.round((1 - priceCents / regularPriceCents) * 100) : 0,
          },
          platforms,
        };
      }
    }
  }
  if (!best) return null;

  const title = p.LocalizedProperties[0]?.ProductTitle ?? p.ProductId;
  const playAnywhere = best.platforms.includes("Windows.Desktop");
  return {
    playAnywhere,
    offer: {
      store: "xbox",
      storeProductId: p.ProductId,
      title,
      platform: "xbox",
      edition: playAnywhere ? PLAY_ANYWHERE : undefined,
      drm: "console",
      isKey: false,
      url: `https://www.xbox.com/pt-BR/games/store/${slugify(title) || "jogo"}/${p.ProductId}`,
      price: best.price,
    },
  };
}

export async function fetchXboxProducts(bigIds: string[]): Promise<Map<string, XboxProduct | null>> {
  const result = new Map<string, XboxProduct | null>();
  for (let i = 0; i < bigIds.length; i += 20) {
    const batch = bigIds.slice(i, i + 20);
    const res = await fetchJson<{ Products?: CatalogProduct[] }>(
      `${CATALOG}?bigIds=${batch.map(encodeURIComponent).join(",")}&market=BR&languages=pt-br`,
    );
    for (const id of batch) result.set(id, null);
    for (const p of res.Products ?? []) result.set(p.ProductId, parseXboxProduct(p));
  }
  return result;
}

/** Sugestões da busca da loja (a mesma da Xbox/Microsoft Store): id e título dos produtos que combinam com o texto. */
async function suggestXboxProducts(query: string): Promise<{ id: string; title: string; type: string }[]> {
  const res = await fetchJson<{ Results?: { Products?: { ProductId: string; Title: string; Type: string }[] }[] }>(
    `https://displaycatalog.mp.microsoft.com/v7.0/productFamilies/autosuggest?market=BR&languages=pt-BR&productFamilyNames=Games&query=${encodeURIComponent(query)}`,
  );
  return (res.Results ?? []).flatMap((r) => (r.Products ?? []).map((p) => ({ id: p.ProductId, title: p.Title, type: p.Type })));
}

export const xboxCollector: StoreCollector = {
  store: "xbox",
  // Os produtos normalmente vêm dos ids do IGDB (ver syncConsoleStores). A busca por título cobre o que o IGDB
  // ainda não cadastrou (lançamentos recentes); só considera produtos de título exatamente igual ao buscado.
  async findByTitle(title) {
    const target = normalizeTitle(title);
    const ids = (await suggestXboxProducts(title)).filter((p) => p.type === "Game" && normalizeTitle(p.title) === target).map((p) => p.id);
    if (!ids.length) return [];
    const products = await fetchXboxProducts(ids.slice(0, 5));
    // preço zero na busca por título não vale: a Microsoft lista R$ 0 em alguns jogos pagos (ex.: Call of Duty MW III)
    return [...products.values()].flatMap((p) => (p && p.offer.price && p.offer.price.priceCents > 0 ? [p.offer] : []));
  },
  async fetchPrices(productIds) {
    const products = await fetchXboxProducts(productIds);
    return new Map([...products].map(([id, p]) => [id, p?.offer.price ?? null]));
  },
};
