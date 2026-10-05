import { count, gt, lt } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { presence } from "@/db/schema";
import { RateLimiter } from "@/lib/rate-limit";

/** Quem não avisou nesse prazo deixa de contar como "no site agora". */
// (as abas avisam a cada 5 min; a folga cobre atrasos)
const ONLINE_WINDOW_MS = 7 * 60_000;

// um aparelho avisa a cada 5 minutos; o limite barra quem tentar inflar o contador
const perVisitor = new RateLimiter(8, 60_000);

/** Registra que esta aba está aberta e devolve quantas pessoas estão no site agora. */
export async function POST(request: NextRequest) {
  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!perVisitor.take(visitor)) return Response.json({ error: "rate" }, { status: 429 });

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  if (typeof body?.id !== "string" || !/^[a-z0-9-]{8,48}$/.test(body.id)) return Response.json({ error: "id" }, { status: 400 });

  const now = new Date();
  await db
    .insert(presence)
    .values({ id: body.id, seenAt: now })
    .onConflictDoUpdate({ target: presence.id, set: { seenAt: now } });
  // limpeza ocasional de registros antigos
  if (Math.random() < 0.02) await db.delete(presence).where(lt(presence.seenAt, new Date(now.getTime() - 24 * 3600_000)));

  const [{ online }] = await db
    .select({ online: count() })
    .from(presence)
    .where(gt(presence.seenAt, new Date(now.getTime() - ONLINE_WINDOW_MS)));
  return Response.json({ online }, { headers: { "Cache-Control": "no-store" } });
}
