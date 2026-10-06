/**
 * Gera o carrossel de apresentação do Dropou para o Instagram (1080×1350, formato 4:5) em ./media-kit/instagram:
 * `DOTENV_CONFIG_PATH=.env.turso npx tsx scripts/instagram-post.tsx` (o slide 3 lê preços reais do banco). Mesmas cores, fonte e símbolo do site (src/lib/brand.ts e globals.css).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { ReactNode } from "react";
import { ImageResponse } from "next/og";
import { getGamePage } from "../src/db/queries";
import { BRAND, LOGO } from "../src/lib/brand";
import { formatCents } from "../src/lib/format";
import { getStore } from "../src/lib/stores";

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

const TABS: [string, string][] = [
  ["Steam", "#66c0f4"],
  ["Epic", "#e8eaef"],
  ["GOG", "#a064ff"],
  ["Nuuvem", "#ff7a1a"],
  ["GMG", "#5ac35a"],
  ["MS Store", "#2b8cff"],
  ["Xbox", "#3fb950"],
  ["PS Store", "#2f7dff"],
  ["eShop", "#ff3b3b"],
];

/** Janela de navegador com as 9 lojas abertas em abas, para ilustrar o "abre 9 abas". */
function BrowserMock() {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: 54, borderRadius: 22, overflow: "hidden", border: `2px solid ${C.line}`, background: C.surface }}>
      <div style={{ display: "flex", flexDirection: "column", background: "#10131a", padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 14 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
          {TABS.map(([name, color], i) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 5, width: 96, height: 54, padding: "0 8px", borderRadius: "12px 12px 0 0", background: i === 0 ? C.surface2 : "#161a23", overflow: "hidden" }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: color, flexShrink: 0 }} />
              <div style={{ display: "flex", fontSize: 17, color: i === 0 ? C.text : C.muted, whiteSpace: "nowrap", overflow: "hidden" }}>{name}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: C.surface2, padding: "14px 20px" }}>
        <div style={{ display: "flex", flex: 1, alignItems: "center", background: "#10131a", borderRadius: 24, padding: "10px 22px", fontSize: 26, color: C.muted }}>loja-de-jogos.com/promocao</div>
      </div>
      <div style={{ display: "flex", gap: 28, padding: "28px 28px 32px" }}>
        <div style={{ display: "flex", width: 150, height: 210, borderRadius: 12, background: C.surface2 }} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
          <div style={{ display: "flex", width: 420, height: 34, borderRadius: 8, background: C.line }} />
          <div style={{ display: "flex", width: 560, height: 20, borderRadius: 8, background: C.surface2 }} />
          <div style={{ display: "flex", width: 480, height: 20, borderRadius: 8, background: C.surface2 }} />
          <div style={{ display: "flex", marginTop: 14, width: 220, height: 60, borderRadius: 10, background: C.surface2 }} />
        </div>
      </div>
    </div>
  );
}

const STORES = ["Steam", "Epic", "GOG", "Nuuvem", "Green Man Gaming", "Microsoft Store", "Xbox", "PlayStation Store", "Nintendo eShop"];

/** Dados reais de um jogo (buscados no banco na hora de gerar): capa e o preço em cada loja. */
interface RealGame {
  title: string;
  cover: string | null;
  rows: { store: string; price: string; best: boolean }[];
  date: string;
}

const slugOfExample = "cyberpunk-2077";

async function loadRealGame(): Promise<RealGame> {
  const data = await getGamePage(slugOfExample);
  if (!data) throw new Error(`jogo ${slugOfExample} não encontrado`);
  // uma oferta por loja (a mais barata), as 4 mais baratas
  const byStore = new Map<string, (typeof data.offers)[number]>();
  for (const o of data.offers) if (o.snapshot && o.finalCents != null && !byStore.has(o.listing.store)) byStore.set(o.listing.store, o);
  const offers = [...byStore.values()].sort((a, b) => a.finalCents! - b.finalCents!).slice(0, 4);
  const cover = data.game.coverUrl ? await fetch(data.game.coverUrl).then(async (r) => `data:${r.headers.get("content-type")};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`) : null;
  return {
    title: data.game.title,
    cover,
    rows: offers.map((o, i) => ({ store: getStore(o.listing.store)?.name ?? o.listing.store, price: formatCents(o.finalCents!), best: i === 0 })),
    date: new Date().toLocaleDateString("pt-BR"),
  };
}

const buildSlides = (g: RealGame): ReactNode[] => [
  // 1 · capa
  <Frame key="1" n={1} footer={false}>
    <Lockup size={150} />
    <div style={{ display: "flex", marginTop: 64 }}>
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
    <BrowserMock />
  </Frame>,

  // 3 · comparar (jogo e preços reais)
  <Frame key="3" n={3}>
    <Big size={130} lines={[["Todas as lojas"], ["num lugar só", true]]} />
    <div style={{ display: "flex", gap: 32, marginTop: 50, alignItems: "stretch" }}>
      {g.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={g.cover} alt="" width={262} height={393} style={{ width: 262, height: 393, objectFit: "cover", borderRadius: 16, border: `2px solid ${C.line}` }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, border: `2px solid ${C.line}`, borderRadius: 18, background: C.surface, overflow: "hidden" }}>
        {g.rows.map((r) => (
          <div key={r.store} style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", padding: "0 26px", background: r.best ? "rgba(182,240,60,0.10)" : "transparent", borderBottom: `2px solid ${C.line}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40 }}>
              {r.store}
              {r.best && <div style={{ display: "flex", fontSize: 22, letterSpacing: 2, textTransform: "uppercase", background: C.accent, color: C.ink, borderRadius: 6, padding: "2px 10px" }}>Menor</div>}
            </div>
            <div style={{ display: "flex", fontSize: 50, color: r.best ? C.accent : C.text2 }}>{r.price}</div>
          </div>
        ))}
        <div style={{ display: "flex", padding: "10px 26px", fontSize: 24, color: C.muted }}>{`${g.title} · preços de ${g.date}`}</div>
      </div>
    </div>
    <Sub size={42}>9 lojas, tudo em reais, do menor pro maior preço.</Sub>
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
    <Sub size={44}>Entra no site e descubra onde o seu próximo jogo está mais barato.</Sub>
    <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 70 }}>
      <div style={{ display: "flex", fontSize: 70, background: C.accent, color: C.ink, borderRadius: 14, padding: "10px 34px", letterSpacing: 1 }}>{BRAND.domain}</div>
      <div style={{ display: "flex", fontSize: 32, letterSpacing: 3, textTransform: "uppercase", border: `2px solid ${C.accent}`, color: C.accent, borderRadius: 10, padding: "4px 16px" }}>beta</div>
    </div>
  </Frame>,
];

async function main() {
  const slides = buildSlides(await loadRealGame());
  const barlow = await readFile("src/assets/BarlowCondensed-Bold.ttf");
  await mkdir(OUT, { recursive: true });
  for (const [i, slide] of slides.entries()) {
    const res = new ImageResponse(slide as React.ReactElement, { width: W, height: H, fonts: [{ name: "Barlow", data: barlow, weight: 700, style: "normal" }] });
    await writeFile(`${OUT}/slide-${i + 1}.png`, Buffer.from(await res.arrayBuffer()));
    console.log("✓ slide", i + 1);
  }
}
main();
