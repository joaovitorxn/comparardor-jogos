"use client";

/** Utilitários de notificações push no navegador (sem conta: a inscrição identifica o aparelho). */

export type PushSupport = "supported" | "ios-needs-install" | "unsupported";

export function getPushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  const hasApis = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (hasApis) return "supported";
  // no iPhone/iPad as notificações só existem com o site instalado na tela inicial
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches;
  return isIos && !standalone ? "ios-needs-install" : "unsupported";
}

async function getRegistration() {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
  return navigator.serviceWorker.ready;
}

/** Inscrição já existente neste aparelho (sem pedir permissão). */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (getPushSupport() !== "supported" || Notification.permission !== "granted") return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  return (await registration?.pushManager.getSubscription()) ?? null;
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = window.atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export class PushPermissionError extends Error {}

/** Pede permissão (se preciso) e devolve a inscrição deste aparelho. */
export async function subscribeToPush(): Promise<PushSubscription> {
  const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (permission !== "granted") throw new PushPermissionError("Permissão de notificações negada.");

  const registration = await getRegistration();
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
  });
}

/** "R$ 25,90", "25,9", "25.90", "25" → centavos. */
export function parseBrl(input: string): number | null {
  const cleaned = input.replace(/[^\d,.]/g, "");
  if (!cleaned) return null;
  // vírgula como decimal; ponto antes de 3 dígitos finais é separador de milhar
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : /\.\d{3}$/.test(cleaned)
      ? cleaned.replace(/\./g, "")
      : cleaned;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? Math.round(value * 100) : null;
}
