/**
 * Puxa a foto de cada produto da página Setup direto do anúncio do Mercado Livre (o link de afiliado leva ao
 * anúncio, que traz a foto nos metadados) e guarda em src/lib/setup-images.json: `npx tsx scripts/setup-photos.mts`.
 * Rode de novo quando adicionar produtos novos em src/lib/setup-products.ts.
 */
import { writeFile } from "node:fs/promises";
import { SETUP_CATEGORIES } from "../src/lib/setup-products";

const images: Record<string, { image: string; title: string }> = {};
for (const product of SETUP_CATEGORIES.flatMap((c) => c.items)) {
  if (!product.mercadoLivre) continue;
  try {
    const res = await fetch(product.mercadoLivre, { headers: { "user-agent": "Mozilla/5.0" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const html = await res.text();
    const og = (p: string) => html.match(new RegExp(`<meta property="${p}" content="([^"]*)"`))?.[1];
    const image = og("og:image");
    if (!image) throw new Error("sem foto na página");
    images[product.mercadoLivre] = { image, title: (og("og:title") ?? "").replace(/&quot;|&#x27;/g, "'") };
    console.log("✓", product.name, "→", image.slice(-40));
  } catch (err) {
    console.warn("✗", product.name, String(err).slice(0, 80));
  }
}
await writeFile("src/lib/setup-images.json", JSON.stringify(images, null, 2) + "\n");
