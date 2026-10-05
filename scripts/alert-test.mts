/**
 * Envia uma notificação de teste para o aparelho que criou alerta mais recentemente —
 * útil para conferir, logo depois de criar um alerta, se as notificações chegam.
 *   npm run alerts:test
 */
import "dotenv/config";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { games, priceAlerts, pushSubscriptions } from "@/db/schema";
import { isPushConfigured, sendPush } from "@/lib/push";

if (!isPushConfigured()) {
  console.error("Chaves VAPID não configuradas no .env");
  process.exit(1);
}

const [latest] = await db
  .select({ sub: pushSubscriptions, game: { title: games.title, slug: games.slug, headerUrl: games.headerUrl } })
  .from(priceAlerts)
  .innerJoin(pushSubscriptions, eq(pushSubscriptions.id, priceAlerts.subscriptionId))
  .innerJoin(games, eq(games.id, priceAlerts.gameId))
  .orderBy(desc(priceAlerts.createdAt))
  .limit(1);

if (!latest) {
  console.log("Nenhum alerta criado ainda.");
  process.exit(0);
}

const site = process.env.VAPID_SUBJECT?.startsWith("https://") ? process.env.VAPID_SUBJECT : "";
const result = await sendPush(latest.sub, {
  title: "Teste: alertas funcionando",
  body: `Você vai ser avisado quando ${latest.game.title} baixar de preço.`,
  url: `${site}/jogo/${latest.game.slug}`,
  image: latest.game.headerUrl ?? undefined,
  tag: "teste",
});
console.log(result === "sent" ? `Notificação de teste enviada (alerta de ${latest.game.title}).` : "O aparelho não aceita mais notificações (inscrição expirada).");
