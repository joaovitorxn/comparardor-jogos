"use client";

import { useEffect, useState } from "react";

/** Distância rolada (em px) a partir da qual o botão aparece. */
const SHOW_AFTER = 900;

/**
 * Botão flutuante "voltar ao topo"; aparece só depois de rolar bastante. No computador fica centralizado no rodapé; no celular
 * vira um círculo só com a seta, empilhado acima do botão de feedback (assim os três botões não se amontoam).
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    // faixa fixa no rodapé só para centralizar; o clique passa direto, exceto no botão
    <div className="fab-top pointer-events-none fixed bottom-[4.75rem] right-4 z-40 md:inset-x-0 md:bottom-4 md:right-0 md:flex md:justify-center">
      <button
        type="button"
        onClick={toTop}
        aria-label="Voltar ao topo"
        tabIndex={visible ? 0 : -1}
        className={`flex h-11 items-center justify-center gap-2 rounded-full max-md:size-12 border border-accent-line bg-surface font-display text-sm font-semibold uppercase tracking-wider text-accent shadow-[var(--float-shadow)] transition md:px-5 duration-200 hover:bg-accent hover:text-accent-ink ${
          visible ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
        </svg>
        <span className="max-md:sr-only">Voltar ao topo</span>
      </button>
    </div>
  );
}
