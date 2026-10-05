import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { getBestPricesByFamily } from "@/db/queries";
import { games, priceAlerts, pushSubscriptions, type PriceAlert } from "@/db/schema";
import { decideAlert, saleThreshold } from "@/lib/alerts";
import { formatCents } from "@/lib/format";
import { isPushConfigured, sendPush, type PushTarget } from "@/lib/push";
import { getStore, PLATFORM_FAMILIES, PLATFORM_LABELS, type PlatformFamilyId } from "@/lib/stores";

const familyLabel = (id: PlatformFamilyId) => PLATFORM_FAMILIES.find((f) => f.id === id)!.label;

export const MAX_ALERTS_PER_DEVICE = 50;

export class AlertError extends Error {}

async function upsertSubscription(sub: PushTarget) {
  const [row] = await db
    .insert(pushSubscriptions)
    .values(sub)
    .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { p256dh: sub.p256dh, auth: sub.auth, updatedAt: new Date() } })
    .returning();
  return row;
}

async function findSubscription(endpoint: string) {
  const [row] = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  return row ?? null;
}

/** Cria ou atualiza o alerta deste aparelho para o jogo. */
export async function saveAlert({
  subscription,
  gameId,
  kind,
  targetCents,
  platformFamily = null,
}: {
  subscription: PushTarget;
  gameId: number;
  kind: PriceAlert["kind"];
  targetCents?: number;
  platformFamily?: PlatformFamilyId | null;
}) {
  const [game] = await db.select({ id: games.id }).from(games).where(eq(games.id, gameId));
  if (!game) throw new AlertError("Jogo não encontrado.");
  const best = (await getBestPricesByFamily([gameId])).get(gameId)?.get(platformFamily ?? "all");
  if (!best) {
    throw new AlertError(platformFamily ? `Este jogo não está à venda em ${familyLabel(platformFamily)} nas lojas que comparamos.` : "Este jogo ainda não tem preço para acompanhar.");
  }

  let thresholdCents: number;
  if (kind === "sale") {
    thresholdCents = saleThreshold(best.cents);
  } else {
    if (!Number.isInteger(targetCents) || targetCents! < 1) throw new AlertError("Informe um preço-alvo válido.");
    if (targetCents! >= best.cents) throw new AlertError(`O alvo precisa ser menor que o preço atual (${formatCents(best.cents)}).`);
    thresholdCents = targetCents!;
  }

  const sub = await upsertSubscription(subscription);
  const [{ total }] = await db.select({ total: count() }).from(priceAlerts).where(eq(priceAlerts.subscriptionId, sub.id));
  const [existing] = await db
    .select({ id: priceAlerts.id })
    .from(priceAlerts)
    .where(and(eq(priceAlerts.subscriptionId, sub.id), eq(priceAlerts.gameId, gameId)));
  if (!existing && total >= MAX_ALERTS_PER_DEVICE) throw new AlertError(`Limite de ${MAX_ALERTS_PER_DEVICE} alertas por aparelho.`);

  const values = { kind, platformFamily, thresholdCents, baselineCents: best.cents, lastNotifiedCents: null, lastNotifiedAt: null };
  const [alert] = await db
    .insert(priceAlerts)
    .values({ subscriptionId: sub.id, gameId, ...values })
    .onConflictDoUpdate({ target: [priceAlerts.subscriptionId, priceAlerts.gameId], set: { ...values, updatedAt: new Date() } })
    .returning();
  return alert;
}

export interface AlertView {
  id: number;
  kind: PriceAlert["kind"];
  platformFamily: PriceAlert["platformFamily"];
  thresholdCents: number;
  baselineCents: number;
  lastNotifiedAt: Date | null;
  game: { id: number; slug: string; title: string; coverUrl: string | null };
  bestCents: number | null;
  bestStore: string | null;
}

/** Alertas deste aparelho, com o preço atual de cada jogo. */
export async function listAlerts(endpoint: string): Promise<AlertView[]> {
  const sub = await findSubscription(endpoint);
  if (!sub) return [];
  const rows = await db
    .select({ alert: priceAlerts, game: { id: games.id, slug: games.slug, title: games.title, coverUrl: games.coverUrl } })
    .from(priceAlerts)
    .innerJoin(games, eq(games.id, priceAlerts.gameId))
    .where(eq(priceAlerts.subscriptionId, sub.id))
    .orderBy(priceAlerts.createdAt);
  const best = await getBestPricesByFamily(rows.map((r) => r.game.id));
  return rows.map(({ alert, game }) => {
    const price = best.get(game.id)?.get(alert.platformFamily ?? "all");
    return {
      id: alert.id,
      kind: alert.kind,
      platformFamily: alert.platformFamily,
      thresholdCents: alert.thresholdCents,
      baselineCents: alert.baselineCents,
      lastNotifiedAt: alert.lastNotifiedAt,
      game,
      bestCents: price?.cents ?? null,
      bestStore: price?.store ?? null,
    };
  });
}

export async function deleteAlert(endpoint: string, gameId: number) {
  const sub = await findSubscription(endpoint);
  if (!sub) return false;
  const res = await db
    .delete(priceAlerts)
    .where(and(eq(priceAlerts.subscriptionId, sub.id), eq(priceAlerts.gameId, gameId)))
    .returning({ id: priceAlerts.id });
  return res.length > 0;
}

/**
 * Compara cada alerta com o menor preço atual e envia as notificações devidas.
 * Roda depois de cada atualização de preços.
 */
export async function checkPriceAlerts() {
  const summary = { checked: 0, sent: 0, rearmed: 0, removed: 0, failed: 0 };
  if (!isPushConfigured()) return summary;

  const rows = await db
    .select({ alert: priceAlerts, sub: pushSubscriptions, game: { id: games.id, slug: games.slug, title: games.title, headerUrl: games.headerUrl } })
    .from(priceAlerts)
    .innerJoin(pushSubscriptions, eq(pushSubscriptions.id, priceAlerts.subscriptionId))
    .innerJoin(games, eq(games.id, priceAlerts.gameId));
  if (!rows.length) return summary;

  const best = await getBestPricesByFamily([...new Set(rows.map((r) => r.game.id))]);
  const gone = new Set<number>();
  const siteUrl = process.env.VAPID_SUBJECT?.startsWith("https://") ? process.env.VAPID_SUBJECT : "";

  for (const { alert, sub, game } of rows) {
    if (gone.has(sub.id)) continue;
    summary.checked++;
    const price = best.get(game.id)?.get(alert.platformFamily ?? "all") ?? null;
    const decision = decideAlert(alert, price?.cents ?? null);

    if (decision.action === "rearm") {
      await db.update(priceAlerts).set({ lastNotifiedCents: null, updatedAt: new Date() }).where(eq(priceAlerts.id, alert.id));
      summary.rearmed++;
      continue;
    }
    if (decision.action !== "notify" || !price) continue;

    const storeName = getStore(price.store)?.name ?? price.store;
    const reason =
      alert.kind === "target"
        ? `Chegou ao seu alvo de ${formatCents(alert.thresholdCents)}`
        : `Antes ${formatCents(alert.baselineCents)}`;
    try {
      const result = await sendPush(sub, {
        title: `${game.title}: ${price.cents === 0 ? "grátis" : formatCents(price.cents)} na ${storeName} (${PLATFORM_LABELS[price.platform]})`,
        body: `${reason}${price.discountPercent > 0 ? ` · -${price.discountPercent}%` : ""}. Toque para comparar.`,
        url: `${siteUrl}/jogo/${game.slug}`,
        image: game.headerUrl ?? undefined,
        tag: `jogo-${game.id}`,
      });
      if (result === "gone") {
        gone.add(sub.id);
        continue;
      }
      await db
        .update(priceAlerts)
        .set({ lastNotifiedCents: price.cents, lastNotifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(priceAlerts.id, alert.id));
      summary.sent++;
    } catch (err) {
      summary.failed++;
      console.warn(`[alertas] falha ao notificar alerta ${alert.id}:`, err);
    }
  }

  // inscrições que não existem mais levam junto os alertas (cascade)
  if (gone.size) {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, [...gone]));
    summary.removed = gone.size;
  }
  return summary;
}
