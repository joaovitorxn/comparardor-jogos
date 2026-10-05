import type { Platform } from "@/db/schema";
import { compareOffers, offerFamilies, type PlatformFamilyId } from "./stores";

/** "all" = qualquer plataforma. */
export type FamilyKey = PlatformFamilyId | "all";

export interface PricedOffer {
  store: string;
  platform: Platform;
  edition: string;
  cents: number;
  regularCents: number;
  discountPercent: number;
}

export interface BestPrice {
  cents: number;
  regularCents: number;
  discountPercent: number;
  store: string;
  platform: Platform;
}

/**
 * Menor preço por família de plataforma (e no geral). Uma oferta Xbox Play Anywhere conta
 * também para PC, porque a compra libera as duas versões.
 */
export function bestByFamily(offers: PricedOffer[]): Map<FamilyKey, BestPrice> {
  const result = new Map<FamilyKey, BestPrice>();
  for (const o of offers) {
    const best: BestPrice = { cents: o.cents, regularCents: o.regularCents, discountPercent: o.discountPercent, store: o.store, platform: o.platform };
    for (const key of ["all", ...offerFamilies(o)] as FamilyKey[]) {
      const current = result.get(key);
      if (!current || compareOffers({ cents: o.cents, store: o.store }, { cents: current.cents, store: current.store }) < 0) result.set(key, best);
    }
  }
  return result;
}
