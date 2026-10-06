import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { DEAL_POOL_TAG } from "@/db/queries";
import { checkPriceAlerts } from "@/services/alerts";
import { refreshPrices, syncExclusives, syncPreorders } from "@/services/catalog";

// atualizar o catálogo inteiro pode levar alguns minutos
export const maxDuration = 300;

/**
 * Atualização periódica de preços — o mesmo que `npm run refresh`, para ser chamado por um
 * agendador (Vercel Cron, GitHub Actions, cron do servidor) com `Authorization: Bearer <CRON_SECRET>`.
 * A Vercel envia esse cabeçalho sozinha quando a variável CRON_SECRET está configurada.
 */
function authorized(header: string | null, secret: string | undefined) {
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!authorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  // limites por execução: com o agendador rodando de hora em hora, o catálogo inteiro roda em rodízio
  const summary = await refreshPrices({ maxPerStore: 800, maxHistory: 150, maxIgdb: 300 });
  // pré-vendas com desconto entram no catálogo; uma falha aqui não derruba a atualização
  const preorders = await syncPreorders().catch(() => -1);
  // exclusivos de PlayStation e Nintendo entram aos poucos (poucos por execução)
  const exclusives = await syncExclusives({ limit: 6 }).catch(() => null);
  // com os preços novos, avisa quem tem alerta
  const alerts = await checkPriceAlerts();
  // preços novos: descarta o cache da home e de todas as páginas de jogo
  revalidatePath("/");
  // a lista de promoções (home e ofertas) é refeita no próximo acesso; até lá serve a anterior
  revalidateTag(DEAL_POOL_TAG, "max");
  revalidatePath("/jogo/[slug]", "page");

  return Response.json({ ok: true, seconds: Math.round((Date.now() - startedAt) / 1000), summary, preorders, exclusives, alerts });
}
