import { fetchJson, HttpError } from "./http";
import type { OfferPrice, StoreCollector, StoreOffer } from "./types";

// Catálogo público da GOG. Atenção: a busca só retorna resultados com locale=en-US.
const CATALOG = "https://catalog.gog.com/v1/catalog";

interface GogMoney {
  amount: string;
  currency: string;
}

interface GogCatalogProduct {
  id: string;
  slug: string;
  title: string;
  productType: "game" | "pack" | "dlc" | "extras";
  storeLink: string;
  price: { finalMoney: GogMoney; baseMoney: GogMoney } | null;
}

const toCents = (amount: string) => Math.round(Number(amount) * 100);

function catalogPrice(p: GogCatalogProduct["price"]): OfferPrice | null {
  if (!p) return null;
  const priceCents = toCents(p.finalMoney.amount);
  const regularPriceCents = toCents(p.baseMoney.amount);
  return {
    currency: p.finalMoney.currency,
    priceCents,
    regularPriceCents,
    discountPercent: regularPriceCents > 0 ? Math.round((1 - priceCents / regularPriceCents) * 100) : 0,
  };
}

/** Monta a oferta a partir do id do produto (ex.: vindo do IGDB) — sem depender do título. */
export async function getGogOfferById(productId: string): Promise<StoreOffer | null> {
  try {
    const product = await fetchJson<{ title: string; links: { product_card: string } }>(`https://api.gog.com/products/${productId}`);
    const prices = await gogCollector.fetchPrices([productId]);
    return {
      store: "gog",
      storeProductId: productId,
      title: product.title,
      platform: "pc",
      drm: "gog",
      isKey: false,
      url: product.links.product_card.replace("gog.com/game/", "gog.com/pt/game/"),
      price: prices.get(productId) ?? null,
    };
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) return null;
    throw err;
  }
}

export const gogCollector: StoreCollector = {
  store: "gog",

  async findByTitle(title) {
    const params = new URLSearchParams({
      limit: "10",
      query: `like:${title}`,
      order: "desc:score",
      productType: "in:game,pack",
      countryCode: "BR",
      locale: "en-US",
      currencyCode: "BRL",
    });
    const res = await fetchJson<{ products: GogCatalogProduct[] }>(`${CATALOG}?${params}`);
    return res.products.map(
      (p): StoreOffer => ({
        store: "gog",
        storeProductId: p.id,
        title: p.title,
        platform: "pc",
        drm: "gog",
        isKey: false,
        url: p.storeLink.replace("/en/", "/pt/"),
        price: catalogPrice(p.price),
      }),
    );
  },

  async fetchPrices(productIds) {
    const result = new Map<string, OfferPrice | null>();
    // a API de preços da GOG é por produto; 6 consultas em paralelo encurtam bastante catálogos grandes
    let next = 0;
    const worker = async () => {
      while (next < productIds.length) {
        const id = productIds[next++];
        await fetchOne(id);
      }
    };
    const fetchOne = async (id: string) => {
      try {
        const res = await fetchJson<{
          _embedded: { prices: { currency: { code: string }; basePrice: string; finalPrice: string }[] };
        }>(`https://api.gog.com/products/${id}/prices?countryCode=BR`);
        const brl = res._embedded.prices.find((p) => p.currency.code === "BRL");
        if (!brl) {
          result.set(id, null);
          return;
        }
        // formato: "4699 BRL" (já em centavos)
        const priceCents = parseInt(brl.finalPrice, 10);
        const regularPriceCents = parseInt(brl.basePrice, 10);
        result.set(id, {
          currency: "BRL",
          priceCents,
          regularPriceCents,
          discountPercent: regularPriceCents > 0 ? Math.round((1 - priceCents / regularPriceCents) * 100) : 0,
        });
      } catch (err) {
        // 404/400 = produto removido, antigo (ids legados vindos do IGDB) ou indisponível no Brasil
        if (err instanceof HttpError && (err.status === 404 || err.status === 400)) result.set(id, null);
        else throw err;
      }
    };
    await Promise.all(Array.from({ length: Math.min(6, productIds.length) }, worker));
    return result;
  },
};
