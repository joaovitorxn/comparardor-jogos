"use client";

import { useEffect, useRef, useState } from "react";
import { RARITY_TIERS, type Rarity } from "@/lib/rarity";
import { RarityTag } from "./ui";

/**
 * Selo de raridade do preço com um "i" ao lado: ao passar o mouse (ou tocar), explica os níveis
 * e as cores. O nível do jogo atual aparece destacado na lista.
 */
export function RarityInfo({ rarity }: { rarity: Rarity }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hover || pinned;

  // toque fora ou Esc fecham a janelinha fixada pelo clique
  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setPinned(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPinned(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  return (
    <div ref={ref} className="relative flex items-center gap-1.5" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <RarityTag rarity={rarity} />
      <button
        type="button"
        onClick={() => setPinned((p) => !p)}
        aria-label="Entenda os níveis de preço"
        aria-expanded={open}
        aria-controls="rarity-tiers"
        className="flex size-5 items-center justify-center rounded-full text-muted transition hover:text-text focus-visible:text-text"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 8h.01" />
        </svg>
      </button>

      {open && (
        <div
          id="rarity-tiers"
          role="tooltip"
          className="absolute right-0 top-full z-50 pt-2"
        >
          <div className="w-64 rounded-[6px] border border-line-strong bg-surface-2 p-3 shadow-2xl shadow-black/60">
            <p className="font-display text-sm font-semibold uppercase tracking-wider text-text">Nível do preço</p>
            <p className="mt-0.5 text-xs leading-snug text-text-2">Quanto maior o desconto da melhor oferta, mais raro o preço.</p>
            <ul className="mt-2.5 space-y-1.5">
              {[...RARITY_TIERS].reverse().map((t) => {
                const current = t.id === rarity.id;
                return (
                  <li key={t.id} className={`flex items-center gap-2 rounded-[4px] px-2 py-1 ${current ? "bg-surface-3" : ""}`}>
                    <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: `var(--rarity-${t.id})` }} />
                    <span className="flex-1 text-xs font-semibold" style={{ color: `var(--rarity-${t.id})` }}>
                      {t.label}
                    </span>
                    <span className="tabular text-xs text-text-2">{t.minDiscount}% ou mais</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
