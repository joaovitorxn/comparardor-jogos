/** Gera public/email/dropou-texto.png: o nome em duas linhas (DRO / POU) para a assinatura de e-mail. */
import { readFile, writeFile } from "node:fs/promises";
import { createElement as h } from "react";
import { ImageResponse } from "next/og";

const barlow = await readFile("src/assets/BarlowCondensed-Bold.ttf");
const size = 78;
const line = (t: string) => h("div", { style: { fontFamily: "Barlow", fontSize: size, lineHeight: 0.84, letterSpacing: size * 0.06, color: "#111111" } }, t);
const res = new ImageResponse(h("div", { style: { width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: "transparent" } }, line("DRO"), line("POU")), {
  width: 180,
  height: 180,
  fonts: [{ name: "Barlow", data: barlow, weight: 700, style: "normal" }],
});
await writeFile("public/email/dropou-texto.png", Buffer.from(await res.arrayBuffer()));
console.log("ok");
