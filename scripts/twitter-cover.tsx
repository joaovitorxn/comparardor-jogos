/**
 * Capa do perfil no X/Twitter (1500×500), versão minimalista: `npx tsx scripts/twitter-cover.tsx`.
 * Salva em media-kit/capa-twitter-1500x500.png. A foto de perfil cobre o canto inferior esquerdo, então o texto
 * fica à direita dela; a linha de fundo é o "gráfico de histórico de preço" caindo até o menor preço.
 */
import { readFile, writeFile } from "node:fs/promises";
import { ImageResponse } from "next/og";
import { BRAND, LOGO } from "../src/lib/brand";

const C = { bg: "#0b0d12", text: "#e8eaef", text2: "#8a93a3", accent: "#b6f03c", line: "#1d2616" };
const W = 1500;
const H = 500;

// degraus de preço que descem até o menor valor (ponto verde)
const STEPS = "M0 62 H240 V36 H480 V80 H720 V46 H960 V86 H1190 V150 H1500";

function Cover() {
  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: C.bg, fontFamily: "Barlow", color: C.text }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <path d={STEPS} fill="none" stroke={C.line} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={1340} cy={150} r={9} fill={C.accent} />
        <circle cx={1340} cy={150} r={22} fill="none" stroke={C.accent} strokeWidth={2} />
      </svg>

      <div style={{ position: "absolute", left: 470, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 18 }}>
        <div style={{ display: "flex", fontSize: 108, lineHeight: 0.94, textTransform: "uppercase", letterSpacing: 2 }}>Desbloqueie o</div>
        <div style={{ display: "flex", fontSize: 108, lineHeight: 0.94, textTransform: "uppercase", letterSpacing: 2, color: C.accent }}>menor preço</div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 34, letterSpacing: 3, color: C.text2 }}>{BRAND.domain}</div>
      </div>
    </div>
  );
}

/** Variante com a logo completa (símbolo + nome) como destaque e o slogan embaixo. */
function CoverLogo() {
  return (
    <div style={{ width: W, height: H, display: "flex", position: "relative", background: C.bg, fontFamily: "Barlow", color: C.text }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <path d={STEPS} fill="none" stroke={C.line} strokeWidth={5} strokeLinejoin="round" />
        <circle cx={1340} cy={150} r={9} fill={C.accent} />
        <circle cx={1340} cy={150} r={22} fill="none" stroke={C.accent} strokeWidth={2} />
      </svg>

      <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 34, marginLeft: 8 }}>
          <div style={{ width: 150, height: 150, display: "flex", alignItems: "center", justifyContent: "center", background: C.accent, borderRadius: 32 }}>
            <svg width={126} height={126} viewBox={LOGO.viewBox}>
              <path d={LOGO.arrow} fill="none" stroke={C.bg} strokeWidth={LOGO.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
              <path d={LOGO.loot} fill={C.bg} />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 170, lineHeight: 1, textTransform: "uppercase", letterSpacing: 6, marginRight: -6 }}>{BRAND.name}</div>
        </div>
        <div style={{ display: "flex", marginTop: 34, fontSize: 56, letterSpacing: 2, textTransform: "uppercase", color: C.accent, marginRight: -2 }}>{BRAND.tagline}</div>
      </div>
    </div>
  );
}

async function main() {
  const barlow = await readFile("src/assets/BarlowCondensed-Bold.ttf");
  const res = new ImageResponse(<Cover />, { width: W, height: H, fonts: [{ name: "Barlow", data: barlow, weight: 700, style: "normal" }] });
  await writeFile("media-kit/capa-twitter-1500x500.png", Buffer.from(await res.arrayBuffer()));
  console.log("✓ media-kit/capa-twitter-1500x500.png");

  const withLogo = new ImageResponse(<CoverLogo />, { width: W, height: H, fonts: [{ name: "Barlow", data: barlow, weight: 700, style: "normal" }] });
  await writeFile("media-kit/capa-twitter-logo-1500x500.png", Buffer.from(await withLogo.arrayBuffer()));
  console.log("✓ media-kit/capa-twitter-logo-1500x500.png");
}
main();
