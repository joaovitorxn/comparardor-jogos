"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";
import { PlatformIcon } from "./store-logo";
import { PLATFORM_FAMILIES, type PlatformFamilyId } from "@/lib/stores";
import { usePlatforms } from "@/lib/use-platforms";

/**
 * "Minhas plataformas" no cabeçalho: a pessoa marca o que joga e o site mostra só as ofertas e os
 * descontos dessas plataformas. Sem nada marcado, mostra tudo.
 */
export function PlatformSelector() {
  const { platforms, setPlatforms } = usePlatforms();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  function toggle(id: PlatformFamilyId) {
    setPlatforms(platforms.includes(id) ? platforms.filter((p) => p !== id) : [...platforms, id]);
  }

  const active = platforms.length > 0;
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={active ? `Minhas plataformas: ${platforms.map((id) => PLATFORM_FAMILIES.find((f) => f.id === id)!.label).join(", ")}` : "Minhas plataformas: todas"}
        className={`flex h-10 items-center gap-2 rounded-[4px] border px-2.5 font-display text-sm font-semibold uppercase tracking-wider transition sm:px-3 ${
          active ? "border-accent-line bg-accent-soft text-accent" : "border-line text-text-2 hover:border-line-strong hover:text-text"
        }`}
      >
        {active ? (
          <span className="flex items-center gap-1.5">
            {platforms.map((id) => (
              <PlatformIcon key={id} family={id} className="size-4" />
            ))}
          </span>
        ) : (
          <Icon name="controller" className="size-5" />
        )}
        <span className="hidden lg:inline">{active ? "Minhas plataformas" : "Plataformas"}</span>
        <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-[6px] border border-line-strong bg-surface-2 p-3 shadow-2xl shadow-black/60">
          <p className="font-display text-sm font-semibold uppercase tracking-wider text-text">Minhas plataformas</p>
          <p className="mt-0.5 text-xs leading-snug text-text-2">Marque o que você joga e mostramos só os jogos e os descontos dessas plataformas.</p>
          <ul className="mt-2.5 space-y-1">
            {PLATFORM_FAMILIES.map((f) => {
              const checked = platforms.includes(f.id);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggle(f.id)}
                    className={`flex w-full items-center gap-3 rounded-[4px] border px-3 py-2 text-left text-sm font-medium transition ${
                      checked ? "border-accent-line bg-accent-soft text-text" : "border-line text-text-2 hover:border-line-strong hover:text-text"
                    }`}
                  >
                    <PlatformIcon family={f.id} className="size-5 shrink-0" />
                    <span className="flex-1">{f.label}</span>
                    <span
                      aria-hidden
                      className={`flex size-5 items-center justify-center rounded-[3px] border ${checked ? "border-accent bg-accent text-accent-ink" : "border-line-strong"}`}
                    >
                      {checked && (
                        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5 12.5 4.5 4.5L19 7" />
                        </svg>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() => setPlatforms([])}
            disabled={!active}
            className="mt-2.5 w-full rounded-[4px] border border-line px-3 py-1.5 text-xs font-medium text-text-2 transition hover:border-accent hover:text-accent disabled:cursor-default disabled:opacity-50 disabled:hover:border-line disabled:hover:text-text-2"
          >
            Mostrar todas as plataformas
          </button>
        </div>
      )}
    </div>
  );
}
