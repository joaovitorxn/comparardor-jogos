import type { NextRequest } from "next/server";
import { isValidPushEndpoint } from "@/lib/push";
import { listAlerts } from "@/services/alerts";

/**
 * Alertas deste aparelho. POST (e não GET) para o endpoint da inscrição — que funciona
 * como identificador secreto do aparelho — não ir parar em logs de URL.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (!isValidPushEndpoint(body?.endpoint)) return Response.json({ error: "Pedido inválido." }, { status: 400 });
  return Response.json({ alerts: await listAlerts(body.endpoint) }, { headers: { "Cache-Control": "no-store" } });
}
