import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND, LOGO } from "@/lib/brand";

// imagem que aparece ao compartilhar o site (WhatsApp, Discord, X); as páginas de jogo usam a arte do jogo
export const alt = `${BRAND.name} — ${BRAND.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STORES = "Steam · Epic · GOG · Nuuvem · Green Man Gaming · Microsoft Store · PlayStation · Xbox · Nintendo";

export default async function OpengraphImage() {
  const barlow = await readFile(join(process.cwd(), "src/assets/BarlowCondensed-Bold.ttf"));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#0b0d12", color: "#e8ebf0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ width: 168, height: 168, display: "flex", alignItems: "center", justifyContent: "center", background: "#b6f03c", borderRadius: 30 }}>
            <svg width={142} height={142} viewBox={LOGO.viewBox}>
              <path d={LOGO.arrow} fill="none" stroke="#0b0d12" strokeWidth={LOGO.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
              <path d={LOGO.loot} fill="#0b0d12" />
            </svg>
          </div>
          <div style={{ fontFamily: "Barlow", fontSize: 176, lineHeight: 1, letterSpacing: 4, textTransform: "uppercase" }}>{BRAND.name}</div>
        </div>
        <div style={{ marginTop: 56, fontFamily: "Barlow", fontSize: 64, color: "#b6f03c" }}>{BRAND.tagline}.</div>
        <div style={{ marginTop: 20, fontSize: 28, color: "#8a93a3" }}>{STORES}</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Barlow", data: barlow, weight: 700, style: "normal" }] },
  );
}
