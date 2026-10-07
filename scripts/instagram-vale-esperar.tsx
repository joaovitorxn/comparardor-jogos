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

const C = { bg: "#0b0d12", surface: "#12151c", line: "#242a36", text: "#e8eaef", text2: "#a5acba", muted: "#727b8c", accent: "#b6f03c", warn: "#f5b83d", ink: "#0b0d12" };
const W = 1080;
const H = 1350;
const OUT = "media-kit/instagram-vale-esperar";
const TOTAL = 3;

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

/** Título de uma linha com um trecho em destaque. */
const Head = ({ before, lime, size = 88 }: { before: string; lime: string; size?: number }) => (
  <div style={{ display: "flex", fontSize: size, lineHeight: 0.94, textTransform: "uppercase", letterSpacing: 1 }}>
    <span style={{ color: C.text }}>{before}</span>
    <span style={{ color: C.accent, marginLeft: size * 0.22 }}>{lime}</span>
  </div>
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
const Ico = ({ name, size, color = C.muted }: { name: keyof typeof ICONS; size: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name].map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

interface Example {
  title: string;
  /** Capa do jogo como data URI (o gerador de imagem não busca endereços sozinho). */
  cover: string | null;
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
  const cover = data.game.coverUrl ? await fetch(data.game.coverUrl).then(async (r) => `data:${r.headers.get("content-type")};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`) : null;
  return {
    title: data.game.title,
    cover,
    verdict: view.verdict,
    historic: low && { cents: low.cents, when: low.date ? low.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "", store: low.store ? (getStore(low.store)?.name ?? low.store) : "" },
  };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** As mesmas frases do cartão do site (src/components/buy-verdict.tsx). */
function notesOf(v: Verdict): { icon: keyof typeof ICONS; text: string }[] {
  const notes: { icon: keyof typeof ICONS; text: string }[] = [];
  if (v.kind === "wait") notes.push({ icon: "floor", text: `No último ano já custou ${formatCents(v.lowCents)}, ${formatCents(v.currentCents - v.lowCents)} a menos que hoje.` });
  if (v.kind === "wait" && v.nearLowCount > 0) notes.push({ icon: "chart", text: `Chegou perto desse preço ${plural(v.nearLowCount, "vez", "vezes")} nos últimos 12 meses.` });
  if (v.kind === "buy") {
    if (v.daysAtCurrent != null) notes.push({ icon: "clock", text: v.daysAtCurrent < 1 ? "Esse preço começou hoje." : `Esse preço está valendo há ${plural(v.daysAtCurrent, "dia", "dias")}.` });
    if (v.nearLowCount > 1) notes.push({ icon: "chart", text: `Já chegou perto dele ${plural(v.nearLowCount, "vez", "vezes")} nos últimos 12 meses.` });
  }
  if (v.sale) {
    const when = v.sale.days === 0 ? "começa hoje" : v.sale.days === 1 ? "começa amanhã" : `${v.sale.approx ? "por volta de " : ""}em ${v.sale.days} dias`;
    notes.push({ icon: "calendar", text: `${v.sale.name}: ${when}. Costuma ter descontos maiores.` });
  }
  return notes;
}

/**
 * Réplica do cartão "Vale esperar?" da página do jogo (src/components/buy-verdict.tsx), com os dados reais do exemplo.
 * Todas as medidas são as do site (em px) multiplicadas por S, para o cartão ficar legível no celular.
 */
const S = 2.0;
const SANS = "Geist";

function VerdictCard({ ex, s = S, compact = false }: { ex: Example; s?: number; compact?: boolean }) {
  const v = ex.verdict;
  const wait = v.kind === "wait";
  const tone = wait ? C.warn : C.accent;
  const rows: { label: string; value: string; hint?: string; icon?: keyof typeof ICONS }[] = [];
  if (ex.historic) rows.push({ label: "Preço histórico", value: formatCents(ex.historic.cents), hint: [ex.historic.when, ex.historic.store].filter(Boolean).join(" · "), icon: "floor" });
  if (!compact && (!ex.historic || ex.historic.cents !== v.lowCents)) rows.push({ label: "Menor em 12 meses", value: formatCents(v.lowCents) });
  rows.push({ label: "Média em 12 meses", value: formatCents(v.avgCents) });
  const notes = notesOf(v);
  const px = (n: number) => n * s;
  const cover = compact ? ex.cover : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", width: 920, border: `${px(1)}px solid ${C.line}`, borderRadius: px(6), background: C.surface, overflow: "hidden" }}>
      {/* título: h2 em caixa alta com ícone */}
      <div style={{ display: "flex", alignItems: "center", gap: px(8), padding: `${px(12)}px ${px(20)}px`, borderBottom: `${px(1)}px solid ${C.line}`, fontFamily: "Barlow", fontSize: px(14), letterSpacing: px(2.1), textTransform: "uppercase", color: C.text2 }}>
        <Ico name={wait ? "hourglass" : "check"} size={px(16)} color={tone} />
        Vale esperar?
      </div>
      {/* (capa e nome do jogo só no slide: o cartão do site fica na página do próprio jogo) */}
      <div style={{ display: "flex", gap: px(16), padding: `${px(16)}px ${px(20)}px` }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" width={px(76)} height={px(114)} style={{ width: px(76), height: px(114), objectFit: "cover", borderRadius: px(4), border: `${px(1)}px solid ${C.line}` }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: px(8) }}>
        <div style={{ display: "flex", alignSelf: "flex-start", fontFamily: SANS, fontSize: px(11), lineHeight: `${px(16)}px`, letterSpacing: px(0.55), textTransform: "uppercase", color: tone, border: `${px(1)}px solid ${wait ? "rgba(245,184,61,0.4)" : "rgba(182,240,60,0.35)"}`, background: wait ? "rgba(245,184,61,0.1)" : "rgba(182,240,60,0.08)", borderRadius: px(3), padding: `${px(1)}px ${px(6)}px` }}>
          {wait ? "Vale esperar" : "Bom momento"}
        </div>
        <div style={{ display: "flex", fontFamily: "Barlow", fontSize: px(24), lineHeight: 1.25, color: C.text }}>{v.title}</div>
        {cover && <div style={{ display: "flex", fontFamily: SANS, fontSize: px(13), color: C.muted }}>{`${ex.title} · hoje ${formatCents(v.currentCents)}`}</div>}
        </div>
      </div>
      {/* notas com ícone */}
      {notes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: px(8), padding: `0 ${px(20)}px ${px(16)}px` }}>
          {notes.map((n) => (
            <div key={n.text} style={{ display: "flex", alignItems: "flex-start", gap: px(10), fontFamily: SANS, fontSize: px(14), lineHeight: `${px(20)}px`, color: C.text2 }}>
              <div style={{ display: "flex", marginTop: px(2) }}>
                <Ico name={n.icon} size={px(16)} />
              </div>
              <div style={{ display: "flex", flex: 1 }}>{n.text}</div>
            </div>
          ))}
        </div>
      )}
      {/* preço histórico, menor e média */}
      {rows.map((r) => (
        <div key={r.label} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: px(12), padding: `${px(10)}px ${px(20)}px`, borderTop: `${px(1)}px solid ${C.line}`, fontFamily: SANS, fontSize: px(14) }}>
          <div style={{ display: "flex", alignItems: "center", gap: px(6), color: C.muted }}>
            {r.icon && <Ico name={r.icon} size={px(16)} />}
            {r.label}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontFamily: "Barlow", fontSize: px(17), color: C.text }}>{r.value}</div>
            {r.hint && <div style={{ display: "flex", fontSize: px(12), color: C.muted }}>{r.hint}</div>}
          </div>
        </div>
      ))}
      {!compact && (
        <div style={{ display: "flex", padding: `${px(8)}px ${px(20)}px`, borderTop: `${px(1)}px solid ${C.line}`, fontFamily: SANS, fontSize: px(11), color: C.muted }}>
          Estimativa pelo histórico de preços. Não é garantia de que o preço vai cair.
        </div>
      )}
    </div>
  );
}

const buildSlides = (wait: Example, buy: Example): ReactNode[] => [
  <Frame key="1" n={1} footer={false}>
    <Lockup size={130} />
    <div style={{ display: "flex", marginTop: 40, alignSelf: "flex-start", fontSize: 36, letterSpacing: 5, textTransform: "uppercase", color: C.ink, background: C.accent, borderRadius: 8, padding: "4px 18px" }}>Nova funcionalidade</div>
    <div style={{ display: "flex", marginTop: 34 }}>
      <Big size={150} lines={[["Vale esperar"], ["ou comprar", true], ["agora?"]]} />
    </div>
    <Sub>O Dropou agora responde isso pra você.</Sub>
    <div style={{ display: "flex", marginTop: 70, alignItems: "center", gap: 18, fontSize: 40, color: C.accent, letterSpacing: 3, textTransform: "uppercase" }}>
      Arrasta pro lado pra entender <span style={{ fontSize: 54 }}>→</span>
    </div>
  </Frame>,

  <Frame key="2" n={2} footer={false}>
    <Head before="Veja na" lime="prática" size={84} />
    <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
      <VerdictCard ex={wait} s={1.5} compact />
      <VerdictCard ex={buy} s={1.5} compact />
    </div>
  </Frame>,

  <Frame key="3" n={3} footer={false}>
    <Lockup size={110} />
    <div style={{ display: "flex", marginTop: 64 }}>
      <Big size={130} lines={[["Descubra agora"], ["se vale esperar", true]]} />
    </div>
    <Sub size={44}>Entra no site, abre o seu próximo jogo e testa a nova funcionalidade. É grátis e sem cadastro.</Sub>
    <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 70 }}>
      <div style={{ display: "flex", fontSize: 70, background: C.accent, color: C.ink, borderRadius: 14, padding: "10px 34px", letterSpacing: 1 }}>{BRAND.domain}</div>
      <div style={{ display: "flex", fontSize: 32, letterSpacing: 3, textTransform: "uppercase", border: `2px solid ${C.accent}`, color: C.accent, borderRadius: 10, padding: "4px 16px" }}>beta</div>
    </div>
  </Frame>,
];

/** No Windows o arquivo pode ficar preso por um instante (antivírus, visualizador): tenta de novo. */
async function save(path: string, data: Buffer) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await writeFile(path, data);
    } catch (err) {
      if (attempt >= 6) throw err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

async function main() {
  const [wait, buy] = await Promise.all([load(WAIT_SLUG), load(BUY_SLUG)]);
  console.log("exemplos:", wait.title, wait.verdict.kind, "|", buy.title, buy.verdict.kind);
  const barlow = await readFile("src/assets/BarlowCondensed-Bold.ttf");
  // o site usa Inter no texto corrido; o Geist (já incluído no Next) é o mais parecido que temos em arquivo
  const geist = await readFile("node_modules/next/dist/compiled/@vercel/og/Geist-Regular.ttf");
  await mkdir(OUT, { recursive: true });
  for (const [i, slide] of buildSlides(wait, buy).entries()) {
    const res = new ImageResponse(slide as React.ReactElement, {
      width: W,
      height: H,
      fonts: [
        { name: "Barlow", data: barlow, weight: 700, style: "normal" },
        { name: "Geist", data: geist, weight: 400, style: "normal" },
      ],
    });
    await save(`${OUT}/slide-${i + 1}.png`, Buffer.from(await res.arrayBuffer()));
    console.log("✓ slide", i + 1);
  }
  process.exit(0);
}
main();
