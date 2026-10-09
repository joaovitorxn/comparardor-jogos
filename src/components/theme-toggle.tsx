"use client";

import { useId, useSyncExternalStore } from "react";

export const THEME_KEY = "dropou-theme";

const THEMES = [
  { id: "dark", label: "Escuro", color: "#0b0d12" },
  { id: "oled", label: "OLED", color: "#000000" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

// o tema vive no atributo data-theme do <html> (definido por um script antes da pintura, ver layout)
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const getTheme = () => (document.documentElement.dataset.theme as ThemeId | undefined) ?? "dark";

function applyTheme(theme: (typeof THEMES)[number]) {
  // a classe liga a transição de cores (ver globals.css) só durante a troca
  const root = document.documentElement;
  root.classList.add("theme-switching");
  window.setTimeout(() => root.classList.remove("theme-switching"), 260);
  document.documentElement.dataset.theme = theme.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.color);
  try {
    localStorage.setItem(THEME_KEY, theme.id);
  } catch {
    // modo privado / armazenamento bloqueado: o tema vale só nesta visita
  }
}

export function ThemeToggle() {
  // no servidor não há DOM: renderiza com "dark" e o React corrige na hidratação
  const current = useSyncExternalStore(subscribe, getTheme, () => "dark" as ThemeId);
  const labelId = useId();

  return (
    <div className="flex items-center gap-2">
      <span id={labelId} className="flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wider text-muted">
        <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
        Tema
      </span>
      <div role="radiogroup" aria-labelledby={labelId} className="inline-flex w-fit rounded-[4px] border border-line-strong bg-surface-2 p-0.5">
        {THEMES.map((theme) => {
          const active = theme.id === current;
          return (
            <button
              key={theme.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => applyTheme(theme)}
              className={`rounded-[3px] px-2.5 py-1 font-display text-xs font-semibold uppercase tracking-wider transition ${
                active ? "bg-accent text-accent-ink" : "text-text-2 hover:text-text"
              }`}
            >
              {theme.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
