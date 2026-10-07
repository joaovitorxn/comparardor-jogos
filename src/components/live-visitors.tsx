"use client";

import { useEffect, useState, type ReactNode } from "react";

const PING_MS = 300_000;
const KEY = "dropou:visitante";

/** O número em destaque (branco, mais forte) e o resto da frase no cinza do site. */
const Count = ({ n }: { n: number }) => <span className="tabular font-bold text-text">{n}</span>;

// frases que se alternam por visita; o plural sai junto com o número
const PHRASES: ((n: number) => ReactNode)[] = [
  (n) => (
    <>
      <Count n={n} /> {n === 1 ? "pessoa procurando" : "pessoas procurando"} promos
    </>
  ),
  (n) => (
    <>
      <Count n={n} /> {n === 1 ? "gamer caçando" : "gamers caçando"} drops
    </>
  ),
  (n) => (
    <>
      <Count n={n} /> {n === 1 ? "pessoa de olho" : "pessoas de olho"} no preço
    </>
  ),
];

function visitorId(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return crypto.randomUUID(); // sem armazenamento: conta só esta visita
  }
}

/** "N pessoas procurando promos": o contador vem do servidor, a cada 5 minutos enquanto a aba está visível. */
export function LiveVisitors() {
  const [state, setState] = useState<{ online: number; phrase: number } | null>(null);

  useEffect(() => {
    const id = visitorId();
    const phrase = Math.floor(Math.random() * PHRASES.length);
    let stopped = false;
    let lastPing = 0;

    async function ping() {
      if (document.visibilityState !== "visible") return;
      // voltar à aba não precisa de aviso novo se o último foi há pouco
      if (Date.now() - lastPing < PING_MS - 5_000) return;
      lastPing = Date.now();
      try {
        const res = await fetch("/api/presenca", { method: "POST", body: JSON.stringify({ id }) });
        if (!res.ok || stopped) return;
        const { online } = (await res.json()) as { online: number };
        setState({ online, phrase });
      } catch {
        // sem rede: mantém o último número
      }
    }

    ping();
    const timer = setInterval(ping, PING_MS);
    document.addEventListener("visibilitychange", ping);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
    };
  }, []);

  if (!state) return null;
  return (
    // mesmo molde das etiquetas e botões do site: borda fina, cantos de 4px, fonte de título em caixa alta
    <p
      className="flex items-center gap-2 rounded-[4px] border border-line bg-surface px-2.5 py-1 font-display text-xs font-semibold uppercase tracking-wider text-text-2"
      aria-live="polite"
    >
      <span aria-hidden className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-accent" />
      </span>
      <span>{PHRASES[state.phrase](state.online)}</span>
    </p>
  );
}
