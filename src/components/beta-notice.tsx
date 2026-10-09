"use client";

import { useSyncExternalStore } from "react";

const KEY = "dropou:aviso-beta";
const EVENT = "dropou:aviso-beta";
export const OPEN_FEEDBACK_EVENT = "dropou:abrir-feedback";

function seen(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    // sem armazenamento não dá para lembrar que a pessoa já viu: melhor não repetir o aviso em toda página
    return true;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function markSeen() {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // ignora: o aviso some só até recarregar
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Aviso da primeira visita: uma faixa fina no topo (some ao rolar) dizendo que o site está em beta e onde mandar feedback. Aparece uma vez por aparelho. */
export function BetaNotice() {
  // no servidor conta como "já visto" (não aparece no HTML); o navegador decide depois de carregar
  const alreadySeen = useSyncExternalStore(subscribe, seen, () => true);
  if (alreadySeen) return null;

  return (
    <aside role="status" aria-label="Aviso: o Dropou está em beta" className="border-b border-accent-line bg-accent-soft">
      <div className="mx-auto flex max-w-7xl items-center gap-x-3 px-4 py-1.5 lg:px-6">
        <p className="min-w-0 flex-1 text-xs leading-snug text-text-2">
          <span className="font-display text-sm font-bold uppercase tracking-wider text-accent">Beta</span>
          <span className="mx-2 text-line-strong" aria-hidden>
            |
          </span>
          Podem aparecer bugs ou preços fora do lugar.{" "}
          <button
            type="button"
            onClick={() => {
              markSeen();
              window.dispatchEvent(new Event(OPEN_FEEDBACK_EVENT));
            }}
            className="font-medium text-text underline decoration-accent-line underline-offset-2 transition hover:text-accent"
          >
            Achou algo estranho? Conte pra mim
          </button>
        </p>
        <button type="button" onClick={markSeen} aria-label="Fechar aviso" className="-mr-2 flex size-8 shrink-0 items-center justify-center text-lg leading-none text-muted transition hover:text-text">
          <span aria-hidden>×</span>
        </button>
      </div>
    </aside>
  );
}
