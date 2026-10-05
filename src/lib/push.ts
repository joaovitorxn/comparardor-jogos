import webpush, { WebPushError } from "web-push";

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Página aberta ao tocar na notificação. */
  url: string;
  /** Imagem grande (Android/Chrome). */
  image?: string;
  /** Agrupa avisos do mesmo jogo: um novo substitui o anterior em vez de empilhar. */
  tag?: string;
}

let configured = false;

export function isPushConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configure() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "https://comparador-jogos.vercel.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

/**
 * Envia uma notificação. Retorna "gone" quando a inscrição não existe mais (a pessoa
 * revogou a permissão ou limpou os dados do navegador) — ela deve ser apagada.
 */
export async function sendPush(target: PushTarget, payload: PushPayload): Promise<"sent" | "gone"> {
  configure();
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(payload),
      { TTL: 24 * 3600, urgency: "normal" },
    );
    return "sent";
  } catch (err) {
    if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) return "gone";
    throw err;
  }
}

/** Só aceita endpoints https de serviços de push (evita usar o servidor para chamar URLs arbitrárias). */
export function isValidPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length > 1000) return false;
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && !/^(localhost|127\.|10\.|192\.168\.|\[)/.test(url.hostname);
  } catch {
    return false;
  }
}
