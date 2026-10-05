import type { NextRequest } from "next/server";
import { isValidPushEndpoint } from "@/lib/push";
import { RateLimiter } from "@/lib/rate-limit";
import { PLATFORM_FAMILIES, type PlatformFamilyId } from "@/lib/stores";
import { AlertError, deleteAlert, saveAlert } from "@/services/alerts";

const perVisitor = new RateLimiter(30, 10 * 60_000);
const FAMILY_IDS = new Set<string>(PLATFORM_FAMILIES.map((f) => f.id));

interface SubscriptionJson {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
}

function parseSubscription(raw: SubscriptionJson | undefined) {
  if (!raw || !isValidPushEndpoint(raw.endpoint)) return null;
  const { p256dh, auth } = raw.keys ?? {};
  if (typeof p256dh !== "string" || typeof auth !== "string" || p256dh.length > 200 || auth.length > 100) return null;
  return { endpoint: raw.endpoint, p256dh, auth };
}

const bad = (error: string, status = 400) => Response.json({ error }, { status });

/** Cria (ou atualiza) um alerta de preço para este aparelho. */
export async function POST(request: NextRequest) {
  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!perVisitor.take(visitor)) return bad("Muitas alterações seguidas. Tente de novo em alguns minutos.", 429);

  const body = (await request.json().catch(() => null)) as {
    subscription?: SubscriptionJson;
    gameId?: unknown;
    kind?: unknown;
    targetCents?: unknown;
    platformFamily?: unknown;
  } | null;
  const subscription = parseSubscription(body?.subscription);
  if (!subscription) return bad("Inscrição de notificações inválida.");
  if (!Number.isInteger(body?.gameId)) return bad("Jogo inválido.");
  if (body?.kind !== "target" && body?.kind !== "sale") return bad("Tipo de alerta inválido.");
  const platformFamily = body.platformFamily ?? null;
  if (platformFamily !== null && !FAMILY_IDS.has(platformFamily as string)) return bad("Plataforma inválida.");

  try {
    const alert = await saveAlert({
      subscription,
      gameId: body.gameId as number,
      kind: body.kind,
      targetCents: typeof body.targetCents === "number" ? Math.round(body.targetCents) : undefined,
      platformFamily: platformFamily as PlatformFamilyId | null,
    });
    return Response.json({ ok: true, thresholdCents: alert.thresholdCents, kind: alert.kind, platformFamily: alert.platformFamily });
  } catch (err) {
    if (err instanceof AlertError) return bad(err.message);
    throw err;
  }
}

/** Remove o alerta deste aparelho para um jogo. */
export async function DELETE(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { endpoint?: unknown; gameId?: unknown } | null;
  if (!isValidPushEndpoint(body?.endpoint) || !Number.isInteger(body?.gameId)) return bad("Pedido inválido.");
  const removed = await deleteAlert(body.endpoint, body.gameId as number);
  return Response.json({ ok: removed });
}
