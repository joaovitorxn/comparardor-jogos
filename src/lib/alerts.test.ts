import { describe, expect, it } from "vitest";
import { decideAlert, saleThreshold } from "./alerts";

const alert = (thresholdCents: number, lastNotifiedCents: number | null = null) => ({ thresholdCents, lastNotifiedCents });

describe("decideAlert", () => {
  it("does nothing while the price is above the target", () => {
    expect(decideAlert(alert(5000), 6000)).toEqual({ action: "none" });
  });

  it("notifies when the price reaches the target", () => {
    expect(decideAlert(alert(5000), 5000)).toEqual({ action: "notify" });
    expect(decideAlert(alert(5000), 3999)).toEqual({ action: "notify" });
  });

  it("does not repeat the same notification", () => {
    expect(decideAlert(alert(5000, 3999), 3999)).toEqual({ action: "none" });
    expect(decideAlert(alert(5000, 3999), 4500)).toEqual({ action: "none" });
  });

  it("notifies again if the price drops further", () => {
    expect(decideAlert(alert(5000, 3999), 2999)).toEqual({ action: "notify" });
  });

  it("rearms when the price goes back above the target", () => {
    expect(decideAlert(alert(5000, 3999), 7999)).toEqual({ action: "rearm" });
  });

  it("ignores games without a known price", () => {
    expect(decideAlert(alert(5000), null)).toEqual({ action: "none" });
  });
});

describe("saleThreshold", () => {
  it("fires on any price below the baseline", () => {
    const t = saleThreshold(7999);
    expect(decideAlert(alert(t), 7999)).toEqual({ action: "none" });
    expect(decideAlert(alert(t), 7998)).toEqual({ action: "notify" });
  });
});
