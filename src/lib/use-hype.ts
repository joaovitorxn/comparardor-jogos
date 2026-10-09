"use client";

import { useCallback, useSyncExternalStore } from "react";
import { setCookie } from "./cookie";
import { HYPE_COOKIE, HYPE_VOTER_COOKIE, parseHyped, serializeHyped } from "./hype";

const YEAR = 365 * 24 * 3600;
const EVENT = "dropou:hypar";

const readCookie = (name: string) => document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1] ?? "";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/** Identificador aleatório de quem vota; criado no primeiro hype. Não identifica a pessoa. */
function voterId(): string {
  let id = readCookie(HYPE_VOTER_COOKIE);
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    id = crypto.randomUUID();
    setCookie(HYPE_VOTER_COOKIE, id, YEAR);
  }
  return id;
}

/** Estado do hype de um jogo neste navegador. O voto vale uma vez só por jogo enquanto os cookies existirem. */
export function useHype(gameId: number) {
  const raw = useSyncExternalStore(subscribe, () => readCookie(HYPE_COOKIE), () => "");
  const hyped = parseHyped(raw).includes(gameId);

  const hype = useCallback(() => {
    const done = parseHyped(readCookie(HYPE_COOKIE));
    if (done.includes(gameId)) return;
    const voter = voterId();
    setCookie(HYPE_COOKIE, serializeHyped([...done, gameId]), YEAR);
    window.dispatchEvent(new Event(EVENT));
    // em segundo plano: se falhar, o voto só não conta no ranking
    void fetch("/api/hype", { method: "POST", body: JSON.stringify({ gameId, voter }), headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }, [gameId]);

  return { hyped, hype };
}
