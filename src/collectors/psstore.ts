import type { Platform } from "@/db/schema";
import { HttpError } from "./http";
import type { OfferPrice, StoreCollector, StoreOffer } from "./types";

/**
 * PlayStation Store (Brasil). Não há API pública: lemos os dados que a própria página do
 * "concept" (ex.: store.playstation.com/pt-br/concept/10002648) já traz em JSON.
 * Os concept ids vêm do IGDB. A loja tem proteção contra robôs, então consultamos pouco e devagar.
 */
const BASE = "https://store.playstation.com/pt-br/concept";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Accept: "text/html",
};

interface PsPrice {
  basePriceValue?: number;
  discountedValue?: number;
  currencyCode?: string;
  isFree?: boolean;
  /** "NONE" para preço normal; "PS_PLUS", "EA_ACCESS"... para preços exclusivos de assinantes. */
  serviceBranding?: string[];
  endTime?: string | null;
}

type Ref = { __ref: string };
type CacheEntry = Record<string, unknown> & { __typename?: string };

export interface PsConcept {
  productId: string;
  title: string;
  platform: Platform;
  price: OfferPrice;
  /** Fim da promoção, quando houver. */
  saleEndsAt: Date | null;
}

const toPrice = (p: PsPrice): OfferPrice | null => {
  if (p.currencyCode && p.currencyCode !== "BRL") return null;
  if (p.isFree) return { currency: "BRL", priceCents: 0, regularPriceCents: 0, discountPercent: 0 };
  if (p.basePriceValue == null) return null;
  const regular = p.basePriceValue;
  const final = p.discountedValue ?? regular;
  return { currency: "BRL", priceCents: final, regularPriceCents: regular, discountPercent: regular > 0 ? Math.round((1 - final / regular) * 100) : 0 };
};

/** Extrai produto, plataforma e preço de compra (sem preços exclusivos de assinatura) do HTML da página. */
export function parsePsConceptPage(html: string, conceptId: string): PsConcept | null {
  for (const m of html.matchAll(/<script id="env:[^"]+" type="application\/json">([\s\S]*?)<\/script>/g)) {
    let block: { args?: { conceptId?: string }; cache?: Record<string, CacheEntry> };
    try {
      block = JSON.parse(m[1]);
    } catch {
      continue;
    }
    if (block.args?.conceptId !== conceptId || !block.cache) continue;
    const cache = block.cache;

    for (const entry of Object.values(cache)) {
      if (entry.__typename !== "Product" || typeof entry.id !== "string") continue;
      const ctas = ((entry.webctas as Ref[] | undefined) ?? []).map((r) => cache[r.__ref]).filter(Boolean);
      // preço normal de compra: ignora ofertas só para assinantes (PS Plus, EA Play…)
      const priced = ctas
        .map((c) => c.price as PsPrice | undefined)
        .filter((p): p is PsPrice => !!p && (p.serviceBranding ?? ["NONE"]).every((b) => b === "NONE"))
        .map((p) => ({ raw: p, price: toPrice(p) }))
        .filter((x): x is { raw: PsPrice; price: OfferPrice } => x.price != null)
        .sort((a, b) => a.price.priceCents - b.price.priceCents);
      if (!priced.length) continue;

      const titleId = String(entry.npTitleId ?? "");
      const end = Number(priced[0].raw.endTime);
      return {
        productId: entry.id,
        title: String(entry.name ?? entry.invariantName ?? ""),
        // PPSA = jogo de PS5; CUSA = PS4 (que também roda no PS5)
        platform: titleId.startsWith("PPSA") ? "ps5" : "ps4",
        price: priced[0].price,
        saleEndsAt: priced[0].price.discountPercent > 0 && Number.isFinite(end) && end > 0 ? new Date(end) : null,
      };
    }
  }
  return null;
}

export function psConceptUrl(conceptId: string) {
  return `${BASE}/${conceptId}`;
}

export async function fetchPsConcept(conceptId: string): Promise<PsConcept | null> {
  const res = await fetch(psConceptUrl(conceptId), { headers: HEADERS, signal: AbortSignal.timeout(20_000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new HttpError(res.status, res.url);
  return parsePsConceptPage(await res.text(), conceptId);
}

export function psOffer(conceptId: string, concept: PsConcept): StoreOffer {
  return {
    store: "psstore",
    storeProductId: conceptId,
    title: concept.title,
    platform: concept.platform,
    drm: "console",
    isKey: false,
    url: psConceptUrl(conceptId),
    price: concept.price,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const psStoreCollector: StoreCollector = {
  store: "psstore",
  // sem busca por título: os concept ids vêm do IGDB (ver syncConsoleStores)
  async findByTitle() {
    return [];
  },
  async fetchPrices(conceptIds) {
    const result = new Map<string, OfferPrice | null>();
    for (const id of conceptIds) {
      try {
        const concept = await fetchPsConcept(id);
        result.set(id, concept?.price ?? null);
      } catch (err) {
        // bloqueio da loja: para a rodada e mantém os preços anteriores
        if (err instanceof HttpError && (err.status === 403 || err.status === 429)) break;
        throw err;
      }
      await sleep(1500); // devagar, para não acionar a proteção contra robôs
    }
    return result;
  },
};
