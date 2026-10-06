import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getGamePage } from "@/db/queries";
import { BRAND, LOGO } from "@/lib/brand";
import { formatCents } from "@/lib/format";
import { getStore } from "@/lib/stores";

// o cartão de compartilhar da promoção: é a prévia do link no WhatsApp, Discord e X, e o botão "Compartilhar" também baixa essa imagem
export const alt = `Preço do jogo no ${BRAND.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
export const revalidate = 1800;

const C = { bg: "#0b0d12", text: "#e8eaef", text2: "#a5acba", muted: "#727b8c", accent: "#b6f03c", ink: "#0b0d12" };

/** Baixa a imagem aqui para não deixar o cartão inteiro falhar se a loja da imagem estiver fora do ar. */
async function dataUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/") || type.includes("webp")) return null;
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function GameOpengraphImage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const [data, barlow] = await Promise.all([getGamePage(slug), readFile(join(process.cwd(), "src/assets/BarlowCondensed-Bold.ttf"))]);
  const fonts = [{ name: "Barlow", data: barlow, weight: 700 as const, style: "normal" as const }];

  const best = data?.offers.find((o) => o.snapshot && o.finalCents != null);
  const snapshot = best?.snapshot ?? null;
  const [cover, hero] = await Promise.all([dataUri(data?.game.coverUrl), dataUri(data?.game.backgroundUrl ?? data?.game.headerUrl)]);

  const title = data?.game.title ?? BRAND.name;
  const atLow = !!(snapshot && data?.historicLow && data.historicLow.cents > 0 && snapshot.priceCents <= data.historicLow.cents);
  const onSale = !!snapshot && snapshot.discountPercent > 0;
  const label = atLow ? "Menor preço de sempre" : onSale ? "Em promoção" : null;
  const store = best ? (getStore(best.listing.store)?.name ?? best.listing.store) : null;
  const titleSize = title.length > 40 ? 56 : title.length > 26 ? 68 : 84;

  const image = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: C.bg, color: C.text, fontFamily: "Barlow" }}>
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover", opacity: 0.5 }} />
        )}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: `linear-gradient(90deg, ${C.bg} 0%, rgba(11,13,18,0.92) 45%, rgba(11,13,18,0.55) 100%)` }} />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "52px 64px 44px" }}>
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 52 }}>
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" width={290} height={435} style={{ width: 290, height: 435, objectFit: "cover", borderRadius: 14, border: "2px solid rgba(255,255,255,0.14)" }} />
            )}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              {label && (
                <div style={{ display: "flex" }}>
                  <div style={{ display: "flex", background: C.accent, color: C.ink, fontSize: 30, letterSpacing: 3, textTransform: "uppercase", padding: "4px 16px", borderRadius: 6 }}>{label}</div>
                </div>
              )}
              <div style={{ marginTop: label ? 20 : 0, fontSize: titleSize, lineHeight: 0.95, textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
              {snapshot && best ? (
                <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                    {onSale && (
                      <div style={{ display: "flex", background: C.accent, color: C.ink, fontSize: 64, lineHeight: 1, padding: "6px 16px", borderRadius: 8 }}>{`-${snapshot.discountPercent}%`}</div>
                    )}
                    <div style={{ display: "flex", fontSize: 128, lineHeight: 1, color: C.accent }}>{snapshot.priceCents === 0 ? "Grátis" : formatCents(best.finalCents!)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 12, fontSize: 38, color: C.text2 }}>
                    {onSale && <div style={{ display: "flex", textDecoration: "line-through" }}>{formatCents(snapshot.regularPriceCents)}</div>}
                    {store && <div style={{ display: "flex" }}>{`na ${store}`}</div>}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 24, fontSize: 44, color: C.text2 }}>Compare o preço em várias lojas</div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: C.accent, borderRadius: 12 }}>
                <svg width={48} height={48} viewBox={LOGO.viewBox}>
                  <path d={LOGO.arrow} fill="none" stroke={C.ink} strokeWidth={LOGO.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={LOGO.loot} fill={C.ink} />
                </svg>
              </div>
              <div style={{ display: "flex", fontSize: 48, lineHeight: 1, textTransform: "uppercase", letterSpacing: 2 }}>{BRAND.name}</div>
            </div>
            <div style={{ display: "flex", fontSize: 34, color: C.text2 }}>{`${BRAND.domain} · ${BRAND.tagline}`}</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
  // o ImageResponse só gera PNG, que com foto passa de 1 MB; o WhatsApp e outros ignoram prévias grandes (~300 KB). Em JPEG fica em ~100 KB
  const jpeg = await sharp(Buffer.from(await image.arrayBuffer())).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=86400" } });
}
