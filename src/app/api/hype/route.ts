import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { games, hypes } from "@/db/schema";
import { RateLimiter } from "@/lib/rate-limit";

const perVisitor = new RateLimiter(30, 10 * 60_000);
// o votante vem do corpo do pedido, então quem quiser pode mandar um novo a cada vez: o que segura é o IP, por jogo
const perVisitorAndGame = new RateLimiter(5, 24 * 3600_000);
const BOTS = /bot|crawl|spider|slurp|headless|preview|lighthouse|python|curl|wget/i;
const VOTER = /^[0-9a-f-]{36}$/i;
const noContent = () => new Response(null, { status: 204 });

/** Lê e valida o pedido (visitante, jogo e votante). Devolve null se for bot, passar do limite ou vier malformado. */
async function readVote(request: NextRequest) {
  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!perVisitor.take(visitor) || BOTS.test(request.headers.get("user-agent") ?? "")) return null;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const gameId = Number(body?.gameId);
  const voter = body?.voter;
  if (!Number.isInteger(gameId) || gameId <= 0 || typeof voter !== "string" || !VOTER.test(voter)) return null;
  return { visitor, gameId, voterHash: createHash("sha256").update(voter.toLowerCase()).digest("hex") };
}

/** Registra um hype. Guarda só o hash do identificador aleatório do cookie, nunca o IP. Sempre responde 204. */
export async function POST(request: NextRequest) {
  const vote = await readVote(request);
  if (!vote) return noContent();
  const { visitor, gameId, voterHash } = vote;
  if (!perVisitorAndGame.take(`${visitor}:${gameId}`)) return noContent();

  const [game] = await db.select({ id: games.id }).from(games).where(eq(games.id, gameId)).limit(1);
  if (!game) return noContent();

  await db.insert(hypes).values({ gameId, voterHash }).onConflictDoNothing();
  return noContent();
}

/** Desfaz o hype do próprio votante (só apaga o voto que tem o mesmo hash). Sempre responde 204. */
export async function DELETE(request: NextRequest) {
  const vote = await readVote(request);
  if (!vote) return noContent();
  await db.delete(hypes).where(and(eq(hypes.gameId, vote.gameId), eq(hypes.voterHash, vote.voterHash)));
  return noContent();
}
