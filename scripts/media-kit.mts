/**
 * Gera o media kit do Dropou (PNGs e SVG) em ./media-kit: `npm run media-kit`.
 * Usa o mesmo símbolo e as mesmas cores do site (src/lib/brand.ts e globals.css).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createElement as h, type ReactElement } from "react";
import { ImageResponse } from "next/og";
import { BRAND, LOGO } from "../src/lib/brand";

const C = {
  bg: "#0b0d12",
  surface: "#12151c",
  surface2: "#181c25",
  line: "#242a36",
  text: "#e8eaef",
  text2: "#a5acba",
  muted: "#727b8c",
  accent: "#b6f03c",
  ink: "#0b0d12",
};
const STORES = "Steam · Epic · GOG · Nuuvem · Green Man Gaming · Microsoft Store · PlayStation · Xbox · Nintendo";
const OUT = "media-kit";
const barlow = await readFile("src/assets/BarlowCondensed-Bold.ttf");
const fonts = [{ name: "Barlow", data: barlow, weight: 700 as const, style: "normal" as const }];

async function png(name: string, width: number, height: number, tree: ReactElement) {
  const res = new ImageResponse(tree, { width, height, fonts });
  await writeFile(`${OUT}/${name}`, Buffer.from(await res.arrayBuffer()));
  console.log("✓", name);
}

/** O símbolo: seta caindo + drop, desenhado dentro de um quadrado do tamanho `size`. */
function mark(size: number, { bg = C.accent, ink = C.ink, radius = 0.18, inset = 0.84 } = {}) {
  return h(
    "div",
    { style: { width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: bg, borderRadius: size * radius } },
    h(
      "svg",
      { width: size * inset, height: size * inset, viewBox: LOGO.viewBox },
      h("path", { d: LOGO.arrow, fill: "none", stroke: ink, strokeWidth: LOGO.strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" }),
      h("path", { d: LOGO.loot, fill: ink }),
    ),
  );
}

const word = (size: number, color = C.text) =>
  h("div", { style: { fontFamily: "Barlow", fontSize: size, lineHeight: 1, letterSpacing: size * 0.025, textTransform: "uppercase", color } }, BRAND.name);

function lockup(iconSize: number, textColor = C.text) {
  return h("div", { style: { display: "flex", alignItems: "center", gap: iconSize * 0.24 } }, mark(iconSize), word(iconSize * 1.05, textColor));
}

const fill = (children: ReactElement | ReactElement[], style: Record<string, unknown> = {}) =>
  h("div", { style: { width: "100%", height: "100%", display: "flex", ...style } }, children);

await mkdir(OUT, { recursive: true });

// símbolo vetorial (o texto da marca depende de fonte, então só o símbolo vai em SVG)
await writeFile(
  `${OUT}/logo-simbolo.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${LOGO.viewBox}"><rect width="28" height="28" rx="5" fill="${C.accent}"/><path d="${LOGO.arrow}" fill="none" stroke="${C.ink}" stroke-width="${LOGO.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/><path d="${LOGO.loot}" fill="${C.ink}"/></svg>\n`,
);
console.log("✓ logo-simbolo.svg");

// ícone e foto de perfil
await png("icone-1024.png", 1024, 1024, mark(1024));
// perfil: as redes recortam em círculo, então o fundo é todo verde e o símbolo fica no miolo
await png("foto-de-perfil-1080.png", 1080, 1080, fill(mark(1080, { radius: 0, inset: 0.62 })));

// logo horizontal: fundo escuro e fundo transparente (texto claro)
await png("logo-horizontal-fundo-escuro.png", 2000, 600, fill(lockup(300), { background: C.bg, alignItems: "center", justifyContent: "center" }));
await png("logo-horizontal-transparente.png", 2000, 600, fill(lockup(300), { alignItems: "center", justifyContent: "center" }));
await png(
  "logo-horizontal-fundo-verde.png",
  2000,
  600,
  fill(
    h("div", { style: { display: "flex", alignItems: "center", gap: 72 } }, mark(300, { bg: C.ink, ink: C.accent }), word(315, C.ink)),
    { background: C.accent, alignItems: "center", justifyContent: "center" },
  ),
);

// capa do Twitter/X (1500x500): a foto de perfil cobre o canto inferior esquerdo, então o conteúdo vai à direita
await png(
  "capa-twitter-1500x500.png",
  1500,
  500,
  fill(
    [
      h("div", { style: { display: "flex", flexDirection: "column", justifyContent: "center", paddingLeft: 460, width: "100%", gap: 18 } },
        lockup(120),
        h("div", { style: { fontFamily: "Barlow", fontSize: 56, color: C.accent, textTransform: "uppercase" } }, BRAND.tagline),
        h("div", { style: { fontFamily: "Barlow", fontSize: 26, color: C.muted } }, STORES),
      ),
    ],
    { background: C.bg },
  ),
);

// post quadrado de apresentação (Instagram, X, Discord)
await png(
  "post-quadrado-1080.png",
  1080,
  1080,
  fill(
    h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", gap: 44, padding: 80 } },
      mark(260),
      word(190),
      h("div", { style: { fontFamily: "Barlow", fontSize: 68, color: C.accent, textTransform: "uppercase", textAlign: "center" } }, BRAND.tagline),
      h("div", { style: { fontFamily: "Barlow", fontSize: 40, color: C.text2 } }, BRAND.domain),
    ),
    { background: C.bg },
  ),
);

// guia rápido da marca (1600x1000)
const swatch = (name: string, hex: string, dark = false) =>
  h("div", { style: { display: "flex", flexDirection: "column", justifyContent: "flex-end", width: 214, height: 170, padding: 18, background: hex, border: `2px solid ${C.line}`, borderRadius: 14, color: dark ? C.ink : C.text, gap: 2 } },
    h("div", { style: { fontFamily: "Barlow", fontSize: 30, textTransform: "uppercase" } }, name),
    h("div", { style: { fontFamily: "Barlow", fontSize: 26, opacity: 0.8 } }, hex.toUpperCase()),
  );
const label = (text: string) => h("div", { style: { fontFamily: "Barlow", fontSize: 28, color: C.muted, textTransform: "uppercase", letterSpacing: 4 } }, text);

await png(
  "guia-da-marca-1600x1000.png",
  1600,
  1000,
  fill(
    h("div", { style: { display: "flex", flexDirection: "column", width: "100%", padding: 70, gap: 40 } },
      h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, lockup(110), h("div", { style: { fontFamily: "Barlow", fontSize: 40, color: C.accent, textTransform: "uppercase" } }, BRAND.tagline)),
      label("Cores"),
      h("div", { style: { display: "flex", gap: 20 } },
        swatch("Verde drop", C.accent, true),
        swatch("Fundo", C.bg),
        swatch("Superfície", C.surface),
        swatch("Texto", C.text, true),
        swatch("Texto 2", C.text2, true),
        swatch("Apagado", C.muted),
      ),
      label("Tipografia"),
      h("div", { style: { display: "flex", alignItems: "flex-end", gap: 60 } },
        h("div", { style: { fontFamily: "Barlow", fontSize: 96, lineHeight: 1, whiteSpace: "nowrap", color: C.text, textTransform: "uppercase" } }, "Barlow Condensed"),
        h("div", { style: { fontFamily: "Barlow", fontSize: 30, color: C.text2, paddingBottom: 8 } }, "Títulos, preços e selos · texto corrido em Inter"),
      ),
      label("Uso"),
      h("div", { style: { display: "flex", gap: 40, fontFamily: "Barlow", fontSize: 34, color: C.text2 } },
        h("div", {}, "Sempre fundo escuro, verde só para o que importa (desconto, botão, marca)"),
      ),
    ),
    { background: C.bg },
  ),
);

await writeFile(
  `${OUT}/LEIA-ME.md`,
  `# Media kit — ${BRAND.name}

${BRAND.tagline} · ${BRAND.domain}

## Arquivos
- \`foto-de-perfil-1080.png\` — foto de perfil (Twitter/X, Instagram, Discord). Fundo todo verde: as redes recortam em círculo.
- \`capa-twitter-1500x500.png\` — capa do perfil no X. O conteúdo fica à direita porque a foto de perfil cobre o canto inferior esquerdo.
- \`post-quadrado-1080.png\` — post de apresentação (1:1).
- \`icone-1024.png\` e \`logo-simbolo.svg\` — só o símbolo (SVG escala sem perder qualidade).
- \`logo-horizontal-*.png\` — símbolo + nome: fundo escuro, transparente (texto claro) e fundo verde.
- \`guia-da-marca-1600x1000.png\` — cores e tipografia.

## Identidade
- Verde drop \`${C.accent}\` (destaques, botões, selos de desconto) · Fundo \`${C.bg}\` · Superfície \`${C.surface}\`
- Texto \`${C.text}\` · Texto secundário \`${C.text2}\` · Apagado \`${C.muted}\`
- Títulos e preços em Barlow Condensed Bold, em maiúsculas; texto corrido em Inter.
- O símbolo é uma seta caindo com um "drop" de loot embaixo: o preço baixou e o prêmio caiu.

## Voz
Informal, de gamer, sem exagero. Gírias do jogo quando soam naturais: "drop", "promo", "wishlist", "dropar".
Exemplos: "Me avisa quando dropar", "Preço lendário", "Quase de graça".

## Cuidados
- Não deformar nem recolorir o símbolo; não colocar o verde sobre fundo claro sem o quadrado escuro.
- Logos das lojas pertencem às respectivas marcas — use só em contexto de comparação.
`,
);
console.log("✓ LEIA-ME.md");
