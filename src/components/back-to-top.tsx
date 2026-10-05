"use client";

import { useEffect, useState } from "react";

/** Distância rolada (em px) a partir da qual o botão aparece. */
const SHOW_AFTER = 900;

/** Botão flutuante "voltar ao topo", acima do botão de feedback; aparece só depois de rolar bastante. */
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
    <button
      type="button"
      onClick={toTop}
      aria-label="Voltar ao topo"
      title="Voltar ao topo"
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-20 right-4 z-40 flex size-11 items-center justify-center rounded-full border border-line-strong bg-surface text-text-2 shadow-lg shadow-black/40 transition duration-200 hover:border-accent hover:text-accent ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
      </svg>
    </button>
  );
}
