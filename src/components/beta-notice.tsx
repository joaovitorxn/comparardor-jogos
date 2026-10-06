"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "./icon";

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

/** Aviso da primeira visita: o site está em beta, pode ter bugs, e o botão de feedback ajuda. Aparece uma vez por aparelho. */
export function BetaNotice() {
  // no servidor conta como "já visto" (não aparece no HTML); o navegador decide depois de carregar
  const alreadySeen = useSyncExternalStore(subscribe, seen, () => true);
  if (alreadySeen) return null;

  return (
    <aside
      role="status"
      aria-label="Aviso: o Dropou está em beta"
      className="fixed inset-x-3 bottom-24 z-40 animate-[showcase-in_400ms_ease-out] rounded-card border border-accent-line bg-surface-2 p-4 shadow-2xl shadow-black/60 sm:inset-x-auto sm:bottom-24 sm:left-4 sm:w-96"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon name="bug" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold uppercase leading-tight tracking-wide text-text">
            O Dropou está em <span className="text-accent">beta</span>
          </p>
          <p className="mt-1 text-sm leading-snug text-text-2">
            O site ainda está em desenvolvimento, então podem aparecer bugs ou preços fora do lugar. Achou algo estranho ou tem uma ideia? Use o botão de
            feedback (o bichinho no canto da tela) e conte pra mim.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                markSeen();
                window.dispatchEvent(new Event(OPEN_FEEDBACK_EVENT));
              }}
              className="h-9 rounded-[4px] bg-accent px-4 font-display text-sm font-bold uppercase tracking-wider text-accent-ink transition hover:brightness-110"
            >
              Dar feedback
            </button>
            <button
              type="button"
              onClick={markSeen}
              className="h-9 rounded-[4px] border border-line px-4 font-display text-sm font-semibold uppercase tracking-wider text-text-2 transition hover:border-accent hover:text-accent"
            >
              Entendi
            </button>
          </div>
        </div>
        <button type="button" onClick={markSeen} aria-label="Fechar aviso" className="-mr-1 -mt-1 p-1 text-xl leading-none text-muted hover:text-text">
          ×
        </button>
      </div>
    </aside>
  );
}
