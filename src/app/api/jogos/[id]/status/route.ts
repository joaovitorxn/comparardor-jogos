import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";

/** Consultado pela página enquanto o jogo é completado com as outras lojas. */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/jogos/[id]/status">) {
  const { id } = await ctx.params;
  const [game] = await db.select({ enrichedAt: games.enrichedAt }).from(games).where(eq(games.id, Number(id)));
  if (!game) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ enriched: game.enrichedAt != null }, { headers: { "Cache-Control": "no-store" } });
}
