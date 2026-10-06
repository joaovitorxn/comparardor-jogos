/**
 * Gera o carrossel de apresentação do Dropou para o Instagram (1080×1350, formato 4:5) em ./media-kit/instagram:
 * `npx tsx scripts/instagram-post.tsx`. Mesmas cores, fonte e símbolo do site (src/lib/brand.ts e globals.css).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { ReactNode } from "react";
import { ImageResponse } from "next/og";
import { BRAND, LOGO } from "../src/lib/brand";

const C = { bg: "#0b0d12", surface: "#12151c", surface2: "#181c25", line: "#242a36", text: "#e8eaef", text2: "#a5acba", muted: "#727b8c", accent: "#b6f03c", ink: "#0b0d12" };
const W = 1080;
const H = 1350;
const OUT = "media-kit/instagram";
const TOTAL = 6;

const Mark = ({ size }: { size: number }) => (
  <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: C.accent, borderRadius: size * 0.2 }}>
    <svg width={size * 0.84} height={size * 0.84} viewBox={LOGO.viewBox}>
      <path d={LOGO.arrow} fill="none" stroke={C.ink} strokeWidth={LOGO.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d={LOGO.loot} fill={C.ink} />
    </svg>
  </div>
);

const Lockup = ({ size = 56 }: { size?: number }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.28 }}>
    <Mark size={size} />
    <div style={{ display: "flex", fontSize: size * 1.05, lineHeight: 1, letterSpacing: size * 0.04, textTransform: "uppercase" }}>{BRAND.name}</div>
  </div>
);

/** Moldura de todos os slides: contador no topo, conteúdo, marca embaixo. */
function Frame({ n, children, footer = true }: { n: number; children: ReactNode; footer?: boolean }) {
  return (
    <div style={{ width: W, height: H, display: "flex", flexDirection: "column", padding: "76px 80px 68px", background: `radial-gradient(circle 560px at 92% 3%, #1c2614 0%, ${C.bg} 100%)`, color: C.text, fontFamily: "Barlow" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 34, letterSpacing: 4, color: C.muted }}>{`${n}/${TOTAL}`}</div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>{children}</div>
      {footer && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Lockup size={52} />
          <div style={{ display: "flex", fontSize: 34, color: C.text2 }}>{BRAND.domain}</div>
        </div>
      )}
    </div>
  );
}

/** Título em linhas explícitas (sem quebra automática); cada linha é [texto, destaque em verde]. */
const Big = ({ lines, size = 128 }: { lines: [string, boolean?][]; size?: number }) => (
  <div style={{ display: "flex", flexDirection: "column" }}>
    {lines.map(([text, lime]) => (
      <div key={text} style={{ display: "flex", fontSize: size, lineHeight: 0.94, textTransform: "uppercase", letterSpacing: 1, color: lime ? C.accent : C.text }}>
        {text}
      </div>
    ))}
  </div>
);
const Sub = ({ children, size = 46 }: { children: ReactNode; size?: number }) => (
  <div style={{ display: "flex", marginTop: 36, fontSize: size, lineHeight: 1.15, color: C.text2 }}>{children}</div>
);

const STORES = ["Steam", "Epic", "GOG", "Nuuvem", "Green Man Gaming", "Microsoft Store", "Xbox", "PlayStation Store", "Nintendo eShop"];

const slides: ReactNode[] = [
  // 1 · capa
  <Frame key="1" n={1} footer={false}>
    <Mark size={190} />
    <div style={{ display: "flex", marginTop: 56 }}>
      <Big size={150} lines={[["Desbloqueie o"], ["menor preço", true]]} />
    </div>
    <Sub>Compare preços de jogos em PC, PlayStation, Xbox e Nintendo.</Sub>
    <div style={{ display: "flex", marginTop: 90, alignItems: "center", gap: 18, fontSize: 40, color: C.accent, letterSpacing: 3, textTransform: "uppercase" }}>
      Arrasta pro lado <span style={{ fontSize: 54 }}>→</span>
    </div>
  </Frame>,

  // 2 · dor
  <Frame key="2" n={2}>
    <Big size={102} lines={[["Quantas abas"], ["você abre pra achar"], ["o jogo mais barato?", true]]} />
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 56 }}>
      {STORES.map((s) => (
        <div key={s} style={{ display: "flex", fontSize: 36, color: C.text2, border: `2px solid ${C.line}`, background: C.surface, borderRadius: 12, padding: "8px 22px" }}>{s}</div>
      ))}
    </div>
  </Frame>,

  // 3 · comparar
  <Frame key="3" n={3}>
    <Big size={140} lines={[["Todas as lojas"], ["num lugar só", true]]} />
    <div style={{ display: "flex", flexDirection: "column", marginTop: 54, border: `2px solid ${C.line}`, borderRadius: 20, background: C.surface, overflow: "hidden" }}>
      {[
        ["Steam", "R$ 89,90", false],
        ["Nuuvem", "R$ 74,99", true],
        ["Epic", "R$ 84,90", false],
      ].map(([store, price, best]) => (
        <div key={String(store)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 36px", background: best ? "rgba(182,240,60,0.10)" : "transparent", borderBottom: `2px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 46 }}>
            {String(store)}
            {best && <div style={{ display: "flex", fontSize: 26, letterSpacing: 2, textTransform: "uppercase", background: C.accent, color: C.ink, borderRadius: 8, padding: "2px 14px" }}>Menor preço</div>}
          </div>
          <div style={{ display: "flex", fontSize: 60, color: best ? C.accent : C.text2 }}>{String(price)}</div>
        </div>
      ))}
      <div style={{ display: "flex", padding: "16px 36px", fontSize: 28, color: C.muted }}>exemplo ilustrativo</div>
    </div>
    <Sub size={42}>9 lojas, tudo em reais, ordenado do menor pro maior preço.</Sub>
  </Frame>,

  // 4 · histórico
  <Frame key="4" n={4}>
    <Big size={116} lines={[["Veja se vale"], ["esperar ou comprar", true]]} />
    <div style={{ display: "flex", flexDirection: "column", marginTop: 54, border: `2px solid ${C.line}`, borderRadius: 20, background: C.surface, padding: "32px 32px 24px" }}>
      <svg width={880} height={300} viewBox="0 0 880 300">
        <line x1="0" y1="250" x2="880" y2="250" stroke={C.line} strokeWidth="2" />
        <path d="M0 80 H210 V40 H330 V150 H470 V70 H600 V210 H700 V60 H880" fill="none" stroke={C.text2} strokeWidth="5" strokeLinejoin="round" />
        <line x1="600" y1="210" x2="880" y2="210" stroke={C.accent} strokeWidth="3" strokeDasharray="10 10" />
        <circle cx="650" cy="210" r="14" fill={C.accent} />
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 2, textTransform: "uppercase", background: C.accent, color: C.ink, borderRadius: 8, padding: "2px 14px" }}>Preço histórico</div>
        <div style={{ display: "flex", fontSize: 34, color: C.text2 }}>o menor valor já registrado</div>
      </div>
    </div>
    <Sub size={42}>Histórico de preços de cada jogo, pra você não comprar caro à toa.</Sub>
  </Frame>,

  // 5 · alerta
  <Frame key="5" n={5}>
    <Big size={140} lines={[["Me avisa"], ["quando dropar", true]]} />
    <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 56, border: `2px solid ${C.line}`, borderRadius: 24, background: C.surface2, padding: "32px 36px" }}>
      <Mark size={96} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 32, letterSpacing: 2, textTransform: "uppercase", color: C.muted }}>Dropou · agora</div>
        <div style={{ display: "flex", fontSize: 50, lineHeight: 1.05, marginTop: 6 }}>Seu jogo dropou pra R$ 49,90</div>
      </div>
    </div>
    <Sub size={42}>Escolha o preço, receba a notificação. Sem cadastro, sem e-mail.</Sub>
  </Frame>,

  // 6 · chamada
  <Frame key="6" n={6} footer={false}>
    <Lockup size={110} />
    <div style={{ display: "flex", marginTop: 64 }}>
      <Big size={150} lines={[["Grátis."], ["Sem cadastro.", true]]} />
    </div>
    <Sub size={44}>Projeto novo, feito por uma pessoa só. Entra, usa e me conta o que achou.</Sub>
    <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 70 }}>
      <div style={{ display: "flex", fontSize: 70, background: C.accent, color: C.ink, borderRadius: 14, padding: "10px 34px", letterSpacing: 1 }}>{BRAND.domain}</div>
      <div style={{ display: "flex", fontSize: 32, letterSpacing: 3, textTransform: "uppercase", border: `2px solid ${C.accent}`, color: C.accent, borderRadius: 10, padding: "4px 16px" }}>beta</div>
    </div>
  </Frame>,
];

async function main() {
  const barlow = await readFile("src/assets/BarlowCondensed-Bold.ttf");
  await mkdir(OUT, { recursive: true });
  for (const [i, slide] of slides.entries()) {
    const res = new ImageResponse(slide as React.ReactElement, { width: W, height: H, fonts: [{ name: "Barlow", data: barlow, weight: 700, style: "normal" }] });
    await writeFile(`${OUT}/slide-${i + 1}.png`, Buffer.from(await res.arrayBuffer()));
    console.log("✓ slide", i + 1);
  }
}
main();
