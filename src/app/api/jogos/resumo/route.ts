import { inArray } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { getBestPrices } from "@/db/queries";
import { games } from "@/db/schema";

/** Resumo (título, capa, menor preço) dos jogos salvos na lista do aparelho. `?ids=1,2,3` */
export async function GET(request: NextRequest) {
  const ids = [
    ...new Set(
      (request.nextUrl.searchParams.get("ids") ?? "")
        .split(",")
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  ].slice(0, 200);
  if (!ids.length) return Response.json({ games: [] });

  const [rows, best] = await Promise.all([
    db.select({ id: games.id, slug: games.slug, title: games.title, coverUrl: games.coverUrl }).from(games).where(inArray(games.id, ids)),
    getBestPrices(ids),
  ]);
  const byId = new Map(rows.map((g) => [g.id, g]));
  return Response.json({
    games: ids.flatMap((id) => {
      const g = byId.get(id);
      if (!g) return [];
      const price = best.get(id);
      return [{ ...g, bestCents: price?.cents ?? null, regularCents: price?.regularCents ?? null, discountPercent: price?.discountPercent ?? 0, bestStore: price?.store ?? null }];
    }),
  });
}
