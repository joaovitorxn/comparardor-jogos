"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./icon";

/** As quatro classificações da Valve, na ordem em que ela as apresenta. */
const LEVELS = [
  { id: 3, name: "Aprovado", icon: "check", color: "text-accent", text: "Funciona bem no Steam Deck, sem ajustes." },
  { id: 2, name: "Jogável", icon: "alert", color: "text-warn", text: "Roda, mas pode exigir ajustes: texto pequeno, controles manuais ou configuração gráfica." },
  { id: 1, name: "Não suportado", icon: "cross", color: "text-danger", text: "Não funciona direito no Steam Deck." },
  { id: 0, name: "Sem análise", icon: "clock", color: "text-muted", text: "A Valve ainda não testou o jogo." },
] as const;

/**
 * Selo do Steam Deck, segundo a Valve: Verificado ("Aprovado") ou Jogável. Jogos não suportados ou ainda sem análise
 * não mostram nada (não é uma informação útil para decidir a compra). Ao clicar ou passar o mouse, abre uma janelinha
 * que explica cada classificação.
 */
export function DeckBadge({ status }: { status: number | null }) {
  // "closing" mantém a janela na tela só até a animação de saída terminar
  const [phase, setPhase] = useState<"closed" | "open" | "closing">("closed");
  const open = phase === "open";
  const setOpen = (next: boolean | ((v: boolean) => boolean)) =>
    setPhase((p) => ((typeof next === "function" ? next(p === "open") : next) ? "open" : p === "closed" ? "closed" : "closing"));
  const ref = useRef<HTMLSpanElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status !== 3 && status !== 2) return null;
  const verified = status === 3;

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex cursor-help items-center gap-1.5 rounded-[3px] border px-1.5 py-px text-xs font-semibold leading-4 ${
          verified ? "border-accent-line bg-accent-soft text-accent" : "border-warn-line bg-warn-soft text-warn"
        }`}
      >
        <Icon name="handheld" className="size-3.5" />
        {verified ? "Aprovado no Steam Deck" : "Jogável no Steam Deck"}
      </button>
      {phase !== "closed" && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Classificações do Steam Deck"
          className="absolute left-0 top-full z-30 w-72 max-w-[calc(100vw-2rem)] pt-2 normal-case tracking-normal"
        >
          <div
            onAnimationEnd={() => setPhase((p) => (p === "closing" ? "closed" : p))}
            className={`${open ? "popover-in" : "popover-out"} rounded-card border border-line-strong bg-surface p-3 text-left shadow-xl shadow-black/50`}>
            <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.15em] text-text-2">Classificação da Valve</p>
            <ul className="space-y-2">
              {LEVELS.map((l) => (
                <li key={l.id} className="flex gap-2 text-xs leading-snug">
                  <Icon name={l.icon} className={`mt-px size-4 shrink-0 ${l.color}`} />
                  <span className="min-w-0">
                    <span className={`font-semibold ${l.color}`}>{l.name}</span>
                    {l.id === status && <span className="text-text-2"> · este jogo</span>}
                    <span className="block text-muted">{l.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </span>
  );
}
