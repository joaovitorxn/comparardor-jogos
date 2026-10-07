import type { NextRequest } from "next/server";
import { db } from "@/db";
import { clicks } from "@/db/schema";
import { RateLimiter } from "@/lib/rate-limit";

const perVisitor = new RateLimiter(60, 10 * 60_000);
const KINDS = ["buy", "giftcard", "setup"] as const;
const BOTS = /bot|crawl|spider|slurp|headless|preview|lighthouse|python|curl|wget/i;

const clip = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** Registra um clique em link de loja. Não guarda IP nem nada que identifique quem clicou. */
export async function POST(request: NextRequest) {
  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!perVisitor.take(visitor) || BOTS.test(request.headers.get("user-agent") ?? "")) return new Response(null, { status: 204 });

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const kind = KINDS.find((k) => k === body?.kind);
  if (!kind) return new Response(null, { status: 204 });

  const gameId = Number(body?.gameId);
  await db.insert(clicks).values({
    kind,
    store: clip(body?.store, 40),
    gameId: Number.isInteger(gameId) && gameId > 0 ? gameId : null,
    target: clip(body?.target, 120),
    page: clip(body?.page, 200),
  });
  return new Response(null, { status: 204 });
}
