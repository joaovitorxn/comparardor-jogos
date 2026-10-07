import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { after, type NextRequest } from "next/server";
import { DEAL_POOL_TAG } from "@/db/queries";
import { checkPriceAlerts } from "@/services/alerts";
import { refreshPrices, syncDeckStatus, syncExclusives, syncPreorders } from "@/services/catalog";

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

async function run() {
  const startedAt = Date.now();
  // limites por execução: com o agendador rodando de hora em hora, o catálogo inteiro roda em rodízio
  // a função serverless morre aos 300s e, se isso acontecer, nada depois dela roda (nem a limpeza de cache):
  // por isso as etapas só começam enquanto houver folga, e os alertas e a limpeza de cache ficam sempre garantidos
  const budget = (seconds: number) => Date.now() < startedAt + seconds * 1000;
  const summary = await refreshPrices({ maxPerStore: 800, maxHistory: 150, maxIgdb: 300, deadline: startedAt + 200_000 });
  // pré-vendas com desconto entram no catálogo; uma falha aqui não derruba a atualização
  const preorders = budget(215) ? await syncPreorders().catch(() => -1) : null;
  // exclusivos de PlayStation e Nintendo entram aos poucos (poucos por execução)
  const exclusives = budget(240) ? await syncExclusives({ limit: 6 }).catch(() => null) : null;
  // status do Steam Deck dos jogos (poucos por rodada, só se sobrar tempo)
  const deck = budget(235) ? await syncDeckStatus({ limit: 40, deadline: startedAt + 255_000 }).catch(() => -1) : null;
  // com os preços novos, avisa quem tem alerta
  const alerts = await checkPriceAlerts();
  // preços novos: descarta o cache da home. As páginas de jogo não: cada regeneração é uma escrita de ISR
  // (200 mil/mês no plano gratuito da Vercel) e elas já se renovam sozinhas (revalidate da página)
  revalidatePath("/");
  // a lista de promoções (home e ofertas) é refeita no próximo acesso; até lá serve a anterior
  revalidateTag(DEAL_POOL_TAG, "max");

  return { ok: true, seconds: Math.round((Date.now() - startedAt) / 1000), summary, preorders, exclusives, deck, alerts };
}

/**
 * Sem parâmetro, responde na hora (202) e faz a atualização em segundo plano: serviços de agendamento
 * externos (cron-job.org) desistem de esperar em ~30s. Com `?wait=1` espera terminar e devolve o resultado
 * (é o que o workflow do GitHub usa, para o status do run refletir o resultado).
 */
export async function GET(request: NextRequest) {
  if (!authorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (request.nextUrl.searchParams.get("wait") === "1") return Response.json(await run());

  after(async () => {
    try {
      console.log("[cron] atualização concluída", JSON.stringify(await run()));
    } catch (err) {
      console.error("[cron] atualização falhou", err);
    }
  });
  return Response.json({ ok: true, started: true }, { status: 202 });
}
