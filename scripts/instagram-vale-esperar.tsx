/**
 * Carrossel de divulgação do "Vale esperar?" para o Instagram (1080×1350, 4:5) em ./media-kit/instagram-vale-esperar:
 * `DOTENV_CONFIG_PATH=.env.turso npx tsx scripts/instagram-vale-esperar.tsx` (os cartões usam preços e vereditos reais do banco).
 * Mesmas cores, fonte e símbolo do site (src/lib/brand.ts e globals.css).
 */
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { ReactNode } from "react";
import { ImageResponse } from "next/og";
import { getGamePage } from "../src/db/queries";
import { BRAND, LOGO } from "../src/lib/brand";
import { formatCents } from "../src/lib/format";
import { getStore } from "../src/lib/stores";
import type { Verdict } from "../src/lib/verdict";
import { buildVerdictViews } from "../src/lib/verdict-variants";

const C = { bg: "#0b0d12", surface: "#12151c", surface2: "#181c25", line: "#242a36", text: "#e8eaef", text2: "#a5acba", muted: "#727b8c", accent: "#b6f03c", warn: "#f5b83d", ink: "#0b0d12" };
const W = 1080;
const H = 1350;
const OUT = "media-kit/instagram-vale-esperar";
const TOTAL = 6;

// jogos de exemplo: um em que vale esperar e um em que é bom comprar (os vereditos vêm do banco, na hora)
const WAIT_SLUG = "age-of-empires-ii-definitive-edition";
const BUY_SLUG = "avowed";

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

/** Ícones do site (mesmos traços de src/components/icon.tsx). */
const ICONS = {
  hourglass: ["M6 3h12", "M6 21h12", "M7 3v3a5 5 0 0 0 2 4l3 2-3 2a5 5 0 0 0-2 4v3", "M17 3v3a5 5 0 0 1-2 4l-3 2 3 2a5 5 0 0 1 2 4v3"],
  check: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M8 12.5l3 3 5-6"],
  floor: ["M12 4v12", "M8 12l4 4 4-4", "M5 20h14"],
  chart: ["M4 19h16", "M4 15l4-6 4 2 4-5 4 4"],
  calendar: ["M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", "M4 10h16", "M8 3v4", "M16 3v4"],
  clock: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 7v5l3 3"],
} as const;
const Ico = ({ name, size = 36, color = C.muted }: { name: keyof typeof ICONS; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

interface Example {
  title: string;
  verdict: Verdict;
  historic: { cents: number; when: string; store: string } | null;
}

async function load(slug: string): Promise<Example> {
  const data = await getGamePage(slug);
  if (!data) throw new Error(`jogo ${slug} não encontrado`);
  const { choices, views } = buildVerdictViews(data);
  const view = views[choices[""]];
  if (!view?.verdict) throw new Error(`sem veredito para ${slug}`);
  const low = view.historicLow;
  return {
    title: data.game.title,
    verdict: view.verdict,
    historic: low && { cents: low.cents, when: low.date ? low.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "", store: low.store ? (getStore(low.store)?.name ?? low.store) : "" },
  };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function notesOf(v: Verdict): { icon: keyof typeof ICONS; text: string }[] {
  const notes: { icon: keyof typeof ICONS; text: string }[] = [];
  if (v.kind === "wait") notes.push({ icon: "floor", text: `No último ano já custou ${formatCents(v.lowCents)}, ${formatCents(v.currentCents - v.lowCents)} a menos que hoje.` });
  if (v.kind === "wait" && v.nearLowCount > 0) notes.push({ icon: "chart", text: `Chegou perto desse preço ${plural(v.nearLowCount, "vez", "vezes")} em 12 meses.` });
  if (v.kind === "buy") {
    if (v.daysAtCurrent != null) notes.push({ icon: "clock", text: v.daysAtCurrent < 1 ? "Esse preço começou hoje." : `Esse preço está valendo há ${plural(v.daysAtCurrent, "dia", "dias")}.` });
    if (v.nearLowCount > 1) notes.push({ icon: "chart", text: `Já chegou perto dele ${plural(v.nearLowCount, "vez", "vezes")} em 12 meses.` });
  }
  if (v.sale) notes.push({ icon: "calendar", text: `${v.sale.name}: ${v.sale.approx ? "por volta de " : ""}em ${v.sale.days} dias.` });
  return notes;
}

/** Réplica do cartão "Vale esperar?" do site, com os dados reais do exemplo. */
function VerdictCard({ ex }: { ex: Example }) {
  const v = ex.verdict;
  const wait = v.kind === "wait";
  const tone = wait ? C.warn : C.accent;
  const rows: [string, string, string?][] = [];
  if (ex.historic) rows.push(["Preço histórico", formatCents(ex.historic.cents), [ex.historic.when, ex.historic.store].filter(Boolean).join(" · ")]);
  if (!ex.historic || ex.historic.cents !== v.lowCents) rows.push(["Menor em 12 meses", formatCents(v.lowCents)]);
  rows.push(["Média em 12 meses", formatCents(v.avgCents)]);
  return (
    <div style={{ display: "flex", flexDirection: "column", border: `2px solid ${C.line}`, borderRadius: 22, background: C.surface, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "22px 34px", borderBottom: `2px solid ${C.line}`, fontSize: 30, letterSpacing: 5, textTransform: "uppercase", color: C.text2 }}>
        <Ico name={wait ? "hourglass" : "check"} size={34} color={tone} />
        Vale esperar?
      </div>
      <div style={{ display: "flex", flexDirection: "column", padding: "28px 34px 12px" }}>
        <div style={{ display: "flex", alignSelf: "flex-start", fontSize: 26, letterSpacing: 3, textTransform: "uppercase", color: tone, border: `2px solid ${wait ? "rgba(245,184,61,0.45)" : "rgba(182,240,60,0.4)"}`, background: wait ? "rgba(245,184,61,0.10)" : "rgba(182,240,60,0.08)", borderRadius: 6, padding: "2px 12px" }}>
          {wait ? "Vale esperar" : "Bom momento"}
        </div>
        <div style={{ display: "flex", marginTop: 16, fontSize: 68, lineHeight: 1, textTransform: "uppercase" }}>{v.title}</div>
        <div style={{ display: "flex", marginTop: 14, fontSize: 32, color: C.muted }}>{`${ex.title} · hoje ${formatCents(v.currentCents)}`}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "10px 34px 26px" }}>
        {notesOf(v).map((n) => (
          <div key={n.text} style={{ display: "flex", alignItems: "flex-start", gap: 16, fontSize: 34, lineHeight: 1.1, color: C.text2 }}>
            <div style={{ display: "flex", marginTop: 2 }}>
              <Ico name={n.icon} size={34} />
            </div>
            <div style={{ display: "flex", flex: 1 }}>{n.text}</div>
          </div>
        ))}
      </div>
      {rows.map(([label, value, hint]) => (
        <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 34px", borderTop: `2px solid ${C.line}` }}>
          <div style={{ display: "flex", fontSize: 32, color: C.muted }}>{label}</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 40, color: C.text }}>{value}</div>
            {hint && <div style={{ display: "flex", fontSize: 24, color: C.muted }}>{hint}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Seletor de plataformas do cabeçalho, com uma marcada, para o slide "muda conforme o que você joga". */
function PlatformChips({ active }: { active: string }) {
  const items = ["PC", "PlayStation", "Xbox", "Nintendo"];
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {items.map((p) => {
        const on = p === active;
        return (
          <div key={p} style={{ display: "flex", fontSize: 42, letterSpacing: 2, textTransform: "uppercase", padding: "12px 30px", borderRadius: 12, border: `2px solid ${on ? C.accent : C.line}`, background: on ? C.accent : C.surface, color: on ? C.ink : C.text2 }}>
            {p}
          </div>
        );
      })}
    </div>
  );
}

const buildSlides = (wait: Example, buy: Example): ReactNode[] => [
  <Frame key="1" n={1} footer={false}>
    <Lockup size={130} />
    <div style={{ display: "flex", marginTop: 40, alignSelf: "flex-start", fontSize: 36, letterSpacing: 5, textTransform: "uppercase", color: C.ink, background: C.accent, borderRadius: 8, padding: "4px 18px" }}>Novidade</div>
    <div style={{ display: "flex", marginTop: 34 }}>
      <Big size={150} lines={[["Vale esperar"], ["ou comprar", true], ["agora?"]]} />
    </div>
    <Sub>O Dropou agora responde isso pra você.</Sub>
    <div style={{ display: "flex", marginTop: 70, alignItems: "center", gap: 18, fontSize: 40, color: C.accent, letterSpacing: 3, textTransform: "uppercase" }}>
      Arrasta pro lado <span style={{ fontSize: 54 }}>→</span>
    </div>
  </Frame>,

  <Frame key="2" n={2}>
    <Big size={118} lines={[["Todo desconto"], ["é um bom"], ["desconto?", true]]} />
    <Sub size={50}>Nem sempre. Tem jogo que já ficou muito mais barato, e tem jogo que está no menor preço agora.</Sub>
    <Sub size={50}>Saber a diferença pode te poupar vários reais.</Sub>
  </Frame>,

  <Frame key="3" n={3}>
    <Big size={92} lines={[["Quando vale"], ["esperar", true]]} />
    <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
      <VerdictCard ex={wait} />
    </div>
  </Frame>,

  <Frame key="4" n={4}>
    <Big size={92} lines={[["Quando é bom"], ["comprar", true]]} />
    <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
      <VerdictCard ex={buy} />
    </div>
  </Frame>,

  <Frame key="5" n={5}>
    <Big size={112} lines={[["Muda conforme"], ["o que você joga", true]]} />
    <div style={{ display: "flex", marginTop: 56 }}>
      <PlatformChips active="PlayStation" />
    </div>
    <Sub size={48}>Marque suas plataformas no site e o veredito considera só as lojas que importam pra você.</Sub>
    <Sub size={36}>Baseado no histórico de preços dos últimos 12 meses. É uma estimativa, não uma garantia.</Sub>
  </Frame>,

  <Frame key="6" n={6} footer={false}>
    <Lockup size={110} />
    <div style={{ display: "flex", marginTop: 64 }}>
      <Big size={140} lines={[["Teste agora."], ["É de graça.", true]]} />
    </div>
    <Sub size={44}>Abra um jogo no site e veja se vale esperar.</Sub>
    <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 70 }}>
      <div style={{ display: "flex", fontSize: 70, background: C.accent, color: C.ink, borderRadius: 14, padding: "10px 34px", letterSpacing: 1 }}>{BRAND.domain}</div>
      <div style={{ display: "flex", fontSize: 32, letterSpacing: 3, textTransform: "uppercase", border: `2px solid ${C.accent}`, color: C.accent, borderRadius: 10, padding: "4px 16px" }}>beta</div>
    </div>
  </Frame>,
];

async function main() {
  const [wait, buy] = await Promise.all([load(WAIT_SLUG), load(BUY_SLUG)]);
  console.log("exemplos:", wait.title, wait.verdict.kind, "|", buy.title, buy.verdict.kind);
  const barlow = await readFile("src/assets/BarlowCondensed-Bold.ttf");
  await mkdir(OUT, { recursive: true });
  for (const [i, slide] of buildSlides(wait, buy).entries()) {
    const res = new ImageResponse(slide as React.ReactElement, { width: W, height: H, fonts: [{ name: "Barlow", data: barlow, weight: 700, style: "normal" }] });
    await writeFile(`${OUT}/slide-${i + 1}.png`, Buffer.from(await res.arrayBuffer()));
    console.log("✓ slide", i + 1);
  }
  process.exit(0);
}
main();
