import { sql } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/db";
import { games } from "@/db/schema";
import { SITE_URL } from "@/lib/site";

// o catálogo cresce sozinho: o mapa é refeito a cada hora
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // só jogos que já têm preço em alguma loja: lançamentos futuros sem preço ainda não têm o que mostrar ao Google
  const rows = await db
    .select({ slug: games.slug, updatedAt: games.updatedAt })
    .from(games)
    .where(sql`exists (select 1 from listings l where l.game_id = ${games.id} and l.available = 1 and l.price_snapshot_id is not null)`);
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/ofertas`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/jogos`, changeFrequency: "daily", priority: 0.5 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/termos`, changeFrequency: "yearly", priority: 0.2 },
    ...rows.map((g) => ({
      url: `${SITE_URL}/jogo/${g.slug}`,
      lastModified: g.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
