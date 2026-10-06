import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getGamePage } from "@/db/queries";
import { BRAND, LOGO } from "@/lib/brand";
import { formatCents } from "@/lib/format";
import { getStore } from "@/lib/stores";

// o cartão vertical (4:5) que a pessoa baixa ou compartilha pelo botão "Compartilhar"; a prévia do link (horizontal) é o opengraph-image
export const revalidate = 1800;

const W = 1080;
const H = 1350;
const C = { bg: "#0b0d12", text: "#e8eaef", text2: "#a5acba", accent: "#b6f03c", ink: "#0b0d12" };

/** Baixa a capa aqui para o cartão não falhar inteiro se a loja da imagem estiver fora do ar. */
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

export async function GET(_request: Request, ctx: RouteContext<"/jogo/[slug]/cartao">) {
  const { slug } = await ctx.params;
  const [data, barlow] = await Promise.all([getGamePage(slug), readFile(join(process.cwd(), "src/assets/BarlowCondensed-Bold.ttf"))]);
  if (!data) return new Response("Jogo não encontrado", { status: 404 });

  const best = data.offers.find((o) => o.snapshot && o.finalCents != null);
  const snapshot = best?.snapshot ?? null;
  const cover = await dataUri(data.game.coverUrl);

  const title = data.game.title;
  const atLow = !!(snapshot && data.historicLow && data.historicLow.cents > 0 && snapshot.priceCents <= data.historicLow.cents);
  const onSale = !!snapshot && snapshot.discountPercent > 0;
  const label = atLow ? "Menor preço de sempre" : onSale ? "Em promoção" : null;
  const store = best ? (getStore(best.listing.store)?.name ?? best.listing.store) : null;
  const titleSize = title.length > 40 ? 62 : title.length > 24 ? 78 : 96;

  const image = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "84px 80px 72px", fontFamily: "Barlow", color: C.text, background: `radial-gradient(circle at 50% 22%, rgba(182,240,60,0.07) 0%, ${C.bg} 58%)` }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" width={400} height={600} style={{ width: 400, height: 600, objectFit: "cover", borderRadius: 20, border: "2px solid rgba(255,255,255,0.14)" }} />
        )}
        {label && (
          <div style={{ display: "flex", marginTop: 44, background: C.accent, color: C.ink, fontSize: 34, letterSpacing: 4, textTransform: "uppercase", padding: "6px 22px", borderRadius: 8 }}>{label}</div>
        )}
        <div style={{ display: "flex", justifyContent: "center", textAlign: "center", marginTop: label ? 26 : 44, fontSize: titleSize, lineHeight: 0.95, textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
        {snapshot && best ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {onSale && <div style={{ display: "flex", background: C.accent, color: C.ink, fontSize: 70, lineHeight: 1, padding: "6px 18px", borderRadius: 10 }}>{`-${snapshot.discountPercent}%`}</div>}
              <div style={{ display: "flex", fontSize: 140, lineHeight: 1, color: C.accent }}>{snapshot.priceCents === 0 ? "Grátis" : formatCents(best.finalCents!)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 10, fontSize: 40, color: C.text2 }}>
              {onSale && <div style={{ display: "flex", textDecoration: "line-through" }}>{formatCents(snapshot.regularPriceCents)}</div>}
              {store && <div style={{ display: "flex" }}>{`na ${store}`}</div>}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", marginTop: 30, fontSize: 48, color: C.text2 }}>Compare o preço em várias lojas</div>
        )}
        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", background: C.accent, borderRadius: 12 }}>
            <svg width={44} height={44} viewBox={LOGO.viewBox}>
              <path d={LOGO.arrow} fill="none" stroke={C.ink} strokeWidth={LOGO.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
              <path d={LOGO.loot} fill={C.ink} />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 46, lineHeight: 1, textTransform: "uppercase", letterSpacing: 2 }}>{BRAND.name}</div>
          <div style={{ display: "flex", fontSize: 34, color: C.text2, marginLeft: 12 }}>{BRAND.domain}</div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: [{ name: "Barlow", data: barlow, weight: 700, style: "normal" }] },
  );
  // PNG com foto passa de 1 MB; em JPEG fica na casa dos 100 KB
  const jpeg = await sharp(Buffer.from(await image.arrayBuffer())).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=86400" } });
}
