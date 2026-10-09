import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { games, hypes } from "@/db/schema";
import { RateLimiter } from "@/lib/rate-limit";

const perVisitor = new RateLimiter(30, 10 * 60_000);
// o votante vem do corpo do pedido, então quem quiser pode mandar um novo a cada vez: o que segura é o IP, por jogo
const perVisitorAndGame = new RateLimiter(5, 24 * 3600_000);
const BOTS = /bot|crawl|spider|slurp|headless|preview|lighthouse|python|curl|wget/i;
const VOTER = /^[0-9a-f-]{36}$/i;

/** Registra um hype. Guarda só o hash do identificador aleatório do cookie, nunca o IP. Sempre responde 204. */
export async function POST(request: NextRequest) {
  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!perVisitor.take(visitor) || BOTS.test(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const gameId = Number(body?.gameId);
  const voter = body?.voter;
  if (!Number.isInteger(gameId) || gameId <= 0 || typeof voter !== "string" || !VOTER.test(voter)) return new Response(null, { status: 204 });

  if (!perVisitorAndGame.take(`${visitor}:${gameId}`)) return new Response(null, { status: 204 });

  const [game] = await db.select({ id: games.id }).from(games).where(eq(games.id, gameId)).limit(1);
  if (!game) return new Response(null, { status: 204 });

  const voterHash = createHash("sha256").update(voter.toLowerCase()).digest("hex");
  await db.insert(hypes).values({ gameId, voterHash }).onConflictDoNothing();
  return new Response(null, { status: 204 });
}
