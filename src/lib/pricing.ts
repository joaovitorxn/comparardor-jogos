import type { Coupon } from "@/db/schema";

export type CouponRule = Pick<
  Coupon,
  | "id"
  | "store"
  | "code"
  | "description"
  | "kind"
  | "value"
  | "minPurchaseCents"
  | "maxDiscountCents"
  | "stacksWithSale"
  | "startsAt"
  | "expiresAt"
  | "active"
>;

export interface PriceInput {
  store: string;
  priceCents: number;
  discountPercent: number;
}

export interface CouponResult {
  finalCents: number;
  savedCents: number;
  coupon: CouponRule | null;
}

export function isCouponApplicable(coupon: CouponRule, price: PriceInput, now = new Date()): boolean {
  if (!coupon.active || coupon.store !== price.store) return false;
  if (coupon.startsAt && coupon.startsAt > now) return false;
  if (coupon.expiresAt && coupon.expiresAt <= now) return false;
  if (coupon.minPurchaseCents != null && price.priceCents < coupon.minPurchaseCents) return false;
  if (!coupon.stacksWithSale && price.discountPercent > 0) return false;
  return price.priceCents > 0;
}

export function couponDiscountCents(coupon: CouponRule, priceCents: number): number {
  let discount =
    coupon.kind === "percent" ? Math.round((priceCents * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscountCents != null) discount = Math.min(discount, coupon.maxDiscountCents);
  return Math.min(discount, priceCents);
}

/** Escolhe o cupom que gera o menor preço final para uma oferta. */
export function applyBestCoupon(
  price: PriceInput,
  coupons: CouponRule[],
  now = new Date(),
): CouponResult {
  let best: CouponResult = { finalCents: price.priceCents, savedCents: 0, coupon: null };
  for (const coupon of coupons) {
    if (!isCouponApplicable(coupon, price, now)) continue;
    const saved = couponDiscountCents(coupon, price.priceCents);
    if (saved > best.savedCents) {
      best = { finalCents: price.priceCents - saved, savedCents: saved, coupon };
    }
  }
  return best;
}
