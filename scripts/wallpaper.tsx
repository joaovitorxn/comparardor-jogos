/**
 * Wallpapers minimalistas do Dropou em 4K (3840×2160), fundo preto puro (bom para OLED):
 * `npx tsx scripts/wallpaper.tsx`. Salva em media-kit/wallpaper-4k-*.png.
 */
import { readFile, writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { BRAND, LOGO } from "../src/lib/brand";

const W = 3840;
const H = 2160;
const C = { black: "#000000", text: "#d9dce3", accent: "#b6f03c", ink: "#0b0d12", line: "#26331a" };

/** A: só a marca, pequena, no centro. */
function Logo() {
  return (
    <div style={{ width: W, height: H, display: "flex", alignItems: "center", justifyContent: "center", background: C.black, fontFamily: "Barlow" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
        <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: C.accent, borderRadius: 44 }}>
          <svg width={168} height={168} viewBox={LOGO.viewBox}>
            <path d={LOGO.arrow} fill="none" stroke={C.ink} strokeWidth={LOGO.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d={LOGO.loot} fill={C.ink} />
          </svg>
        </div>
        <div style={{ display: "flex", fontSize: 230, lineHeight: 1, letterSpacing: 10, textTransform: "uppercase", color: C.text }}>{BRAND.name}</div>
      </div>
    </div>
  );
}

/** B: sem texto, só a linha do preço caindo até o ponto verde. */
function Drop() {
  return (
    <div style={{ width: W, height: H, display: "flex", background: C.black }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <path d="M0 760 H760 V690 H1320 V820 H1900 V740 H2400 V1010 H2900 V1180 H3840" fill="none" stroke={C.line} strokeWidth={8} strokeLinejoin="round" />
        <circle cx={3180} cy={1180} r={16} fill={C.accent} />
        <circle cx={3180} cy={1180} r={42} fill="none" stroke={C.accent} strokeWidth={4} />
      </svg>
    </div>
  );
}

async function main() {
  const barlow = await readFile("src/assets/BarlowCondensed-Bold.ttf");
  const fonts = [{ name: "Barlow", data: barlow, weight: 700 as const, style: "normal" as const }];
  for (const [name, node] of [
    ["logo", <Logo key="a" />],
    ["queda", <Drop key="b" />],
  ] as const) {
    const res = new ImageResponse(node, { width: W, height: H, fonts });
    await writeFile(`media-kit/wallpaper-4k-${name}.png`, Buffer.from(await res.arrayBuffer()));
    console.log("✓", `media-kit/wallpaper-4k-${name}.png`);
  }
}
main();
