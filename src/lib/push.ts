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
    process.env.VAPID_SUBJECT ?? "https://dropou.com.br",
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

/** Serviços de push dos navegadores (Chrome/Edge/Opera via FCM, Firefox, Edge/Windows, Safari). */
const PUSH_HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/, /(^|\.)push\.apple\.com$/];

/**
 * Só aceita endpoints https dos serviços de push conhecidos: o servidor envia notificações para
 * esse endereço, então uma lista aberta permitiria usá-lo para chamar URLs arbitrárias (SSRF).
 */
export function isValidPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || endpoint.length > 1000) return false;
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && !url.port && !url.username && PUSH_HOSTS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}
