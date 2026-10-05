import { PLAY_ANYWHERE } from "@/lib/stores";
import { slugify } from "@/lib/text";
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

export const xboxCollector: StoreCollector = {
  store: "xbox",
  // sem busca por título: os produtos vêm dos ids do IGDB (ver syncConsoleStores)
  async findByTitle() {
    return [];
  },
  async fetchPrices(productIds) {
    const products = await fetchXboxProducts(productIds);
    return new Map([...products].map(([id, p]) => [id, p?.offer.price ?? null]));
  },
};
