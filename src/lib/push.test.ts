import { describe, expect, it } from "vitest";
import { isValidPushEndpoint } from "./push";

describe("isValidPushEndpoint", () => {
  it("accepts the browsers' push services", () => {
    for (const url of [
      "https://fcm.googleapis.com/fcm/send/abc",
      "https://updates.push.services.mozilla.com/wpush/v2/abc",
      "https://wns2-par02p.notify.windows.com/w/?token=abc",
      "https://web.push.apple.com/abc",
    ]) {
      expect(isValidPushEndpoint(url)).toBe(true);
    }
  });

  it("rejects internal and arbitrary hosts", () => {
    for (const url of [
      "http://fcm.googleapis.com/x",
      "https://169.254.169.254/latest/meta-data",
      "https://172.16.0.1/x",
      "https://localhost/x",
      "https://example.com/x",
      "https://fcm.googleapis.com.evil.com/x",
      "https://evil.com/fcm.googleapis.com",
      "https://user@fcm.googleapis.com/x",
      "https://fcm.googleapis.com:8443/x",
    ]) {
      expect(isValidPushEndpoint(url)).toBe(false);
    }
  });
});
