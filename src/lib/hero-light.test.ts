import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { isLightSide, rightSideStats } from "./hero-light";

const width = 200;
const height = 60;

/** Imagem 200×60 em tons de cinza: `left` e `right` dão o valor (0–255) de cada pixel da esquerda e da direita. */
async function image(left: (x: number, y: number) => number, right: (x: number, y: number) => number) {
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = x < width * 0.5 ? left(x, y) : right(x, y);
      raw.fill(v, (y * width + x) * 3, (y * width + x) * 3 + 3);
    }
  }
  return sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
}

describe("isLightSide", () => {
  it("flags art with a plain white gradient on the right (art on the left, blank on the right)", async () => {
    const buf = await image(() => 40, (_x, y) => 255 - y); // degradê quase liso e claro
    expect(isLightSide(await rightSideStats(buf))).toBe(true);
  });

  it("does not flag a normal dark hero", async () => {
    const buf = await image(() => 200, () => 30);
    expect(isLightSide(await rightSideStats(buf))).toBe(false);
  });

  it("does not flag bright but detailed art (misty sky, snow), which looks fine in the banner", async () => {
    const buf = await image(() => 40, (x) => (Math.floor(x / 10) % 2 === 0 ? 110 : 255)); // claro, porém cheio de detalhe (faixas largas, para sobreviver à redução)
    const stats = await rightSideStats(buf);
    expect(stats.mean).toBeGreaterThan(150);
    expect(isLightSide(stats)).toBe(false);
  });

  it("only looks at the right side, so a bright left side does not matter", async () => {
    const buf = await image(() => 250, () => 20);
    expect(isLightSide(await rightSideStats(buf))).toBe(false);
  });
});
