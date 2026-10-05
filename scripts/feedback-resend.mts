/**
 * Reenvia para o Discord os feedbacks já guardados (do mais antigo para o mais novo).
 *   npx tsx --env-file=.env --env-file=.env.turso scripts/feedback-resend.mts
 * (.env traz FEEDBACK_WEBHOOK_URL; .env.turso aponta para o banco de produção.)
 */
import { asc } from "drizzle-orm";
import { db } from "../src/db";
import { feedback } from "../src/db/schema";

const webhook = process.env.FEEDBACK_WEBHOOK_URL;
if (!webhook?.startsWith("https://")) throw new Error("FEEDBACK_WEBHOOK_URL não configurada");

const LABELS = { bug: "🐞 Bug", sugestao: "💡 Sugestão", elogio: "💚 Elogio", outro: "💬 Outro" } as const;
const rows = await db.select().from(feedback).orderBy(asc(feedback.createdAt));

for (const f of rows) {
  const lines = [`**${LABELS[f.kind]}** — ${f.page ?? "?"} · ${f.createdAt.toLocaleString("pt-BR")}`, f.message.slice(0, 1500), f.contact ? `↩️ ${f.contact}` : ""].filter(Boolean);
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: lines.join("\n").slice(0, 1900), allowed_mentions: { parse: [] } }),
  });
  console.log(`#${f.id}`, res.ok ? "enviado" : `falhou (${res.status})`);
  await new Promise((r) => setTimeout(r, 1200)); // limite de envios do Discord
}
console.log(`${rows.length} feedback(s) processados.`);
