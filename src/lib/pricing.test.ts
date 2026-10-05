import { describe, expect, it } from "vitest";
import { applyBestCoupon, type CouponRule } from "./pricing";

const now = new Date("2026-10-05T12:00:00Z");

function coupon(overrides: Partial<CouponRule>): CouponRule {
  return {
    id: 1,
    store: "nuuvem",
    code: "TESTE10",
    description: "10% off",
    kind: "percent",
    value: 10,
    minPurchaseCents: null,
    maxDiscountCents: null,
    stacksWithSale: true,
    startsAt: null,
    expiresAt: null,
    active: true,
    ...overrides,
  };
}

const price = { store: "nuuvem", priceCents: 10000, discountPercent: 0 };

describe("applyBestCoupon", () => {
  it("returns the original price when no coupon applies", () => {
    expect(applyBestCoupon(price, [], now)).toEqual({ finalCents: 10000, savedCents: 0, coupon: null });
  });

  it("applies a percent coupon", () => {
    const r = applyBestCoupon(price, [coupon({})], now);
    expect(r.finalCents).toBe(9000);
    expect(r.coupon?.code).toBe("TESTE10");
  });

  it("picks the coupon with the biggest saving", () => {
    const r = applyBestCoupon(
      price,
      [coupon({ id: 1, value: 10 }), coupon({ id: 2, kind: "fixed", value: 2500 })],
      now,
    );
    expect(r.coupon?.id).toBe(2);
    expect(r.finalCents).toBe(7500);
  });

  it("caps percent coupons at maxDiscountCents", () => {
    const r = applyBestCoupon(price, [coupon({ value: 50, maxDiscountCents: 2000 })], now);
    expect(r.finalCents).toBe(8000);
  });

  it("never goes below zero with fixed coupons", () => {
    const r = applyBestCoupon({ ...price, priceCents: 1000 }, [coupon({ kind: "fixed", value: 2500 })], now);
    expect(r.finalCents).toBe(0);
  });

  it("ignores coupons from other stores, expired, inactive, or below minimum purchase", () => {
    const r = applyBestCoupon(
      price,
      [
        coupon({ store: "steam" }),
        coupon({ expiresAt: new Date("2026-10-01") }),
        coupon({ startsAt: new Date("2026-11-01") }),
        coupon({ active: false }),
        coupon({ minPurchaseCents: 15000 }),
      ],
      now,
    );
    expect(r.coupon).toBeNull();
  });

  it("skips non-stacking coupons when the game is already on sale", () => {
    const onSale = { ...price, discountPercent: 30 };
    expect(applyBestCoupon(onSale, [coupon({ stacksWithSale: false })], now).coupon).toBeNull();
    expect(applyBestCoupon(price, [coupon({ stacksWithSale: false })], now).coupon).not.toBeNull();
  });
});
