/**
 * Reenvia para o Discord os feedbacks já guardados (do mais antigo para o mais novo).
 * Com um número no fim (ex.: `... scripts/feedback-resend.mts 2`), reenvia só o feedback desse id.
 *   npx tsx --env-file=.env --env-file=.env.turso scripts/feedback-resend.mts
 * (.env traz FEEDBACK_WEBHOOK_URL; .env.turso aponta para o banco de produção.)
 */
import { asc } from "drizzle-orm";
import { db } from "../src/db";
import { feedback } from "../src/db/schema";
import { discordFeedbackPayload } from "../src/lib/feedback-discord";

const webhook = process.env.FEEDBACK_WEBHOOK_URL;
if (!webhook?.startsWith("https://")) throw new Error("FEEDBACK_WEBHOOK_URL não configurada");

const only = Number(process.argv[2]) || null;
const rows = (await db.select().from(feedback).orderBy(asc(feedback.createdAt))).filter((f) => !only || f.id === only);

for (const f of rows) {
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(discordFeedbackPayload(f)),
  });
  console.log(`#${f.id}`, res.ok ? "enviado" : `falhou (${res.status})`);
  await new Promise((r) => setTimeout(r, 1200)); // limite de envios do Discord
}
console.log(`${rows.length} feedback(s) processados.`);
