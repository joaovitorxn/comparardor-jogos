import { after, type NextRequest } from "next/server";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { RateLimiter } from "@/lib/rate-limit";

const perVisitor = new RateLimiter(5, 10 * 60_000);
const KINDS = { bug: "🐞 Bug", sugestao: "💡 Sugestão", elogio: "💚 Elogio", outro: "💬 Outro" } as const;
type Kind = keyof typeof KINDS;

const bad = (error: string, status = 400) => Response.json({ error }, { status });

/** Recebe um feedback, guarda no banco e, se FEEDBACK_WEBHOOK_URL existir, avisa no Discord. */
export async function POST(request: NextRequest) {
  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!perVisitor.take(visitor)) return bad("Você já enviou bastante coisa. Tenta de novo daqui a pouco.", 429);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  // campo escondido que só robôs preenchem: finge sucesso e descarta
  if (body?.website) return Response.json({ ok: true });

  const kind = body?.kind;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (typeof kind !== "string" || !(kind in KINDS)) return bad("Escolha o tipo do feedback.");
  if (message.length < 5) return bad("Escreva um pouco mais para a gente entender.");
  if (message.length > 1500) return bad("Mensagem muito longa (máximo de 1500 caracteres).");

  const contact = typeof body?.contact === "string" ? body.contact.trim().slice(0, 120) || null : null;
  const page = typeof body?.page === "string" ? body.page.slice(0, 300) : null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

  await db.insert(feedback).values({ kind: kind as Kind, message, contact, page, userAgent });

  const webhook = process.env.FEEDBACK_WEBHOOK_URL;
  if (webhook?.startsWith("https://")) {
    after(async () => {
      const lines = [`**${KINDS[kind as Kind]}** — ${page ?? "?"}`, message.slice(0, 1500), contact ? `↩️ ${contact}` : ""].filter(Boolean);
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // allowed_mentions vazio: ninguém consegue marcar @everyone pelo formulário
        body: JSON.stringify({ content: lines.join("\n").slice(0, 1900), allowed_mentions: { parse: [] } }),
      }).catch(() => {});
    });
  }
  return Response.json({ ok: true });
}
