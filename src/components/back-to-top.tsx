"use client";

import { useEffect, useRef, useState } from "react";

/** Distância rolada (em px) a partir da qual o botão aparece. */
const SHOW_AFTER = 900;

/** Folga (em px) entre o botão e o topo do rodapé quando ele para de acompanhar a tela. */
const FOOTER_GAP = 16;

/**
 * Botão flutuante "voltar ao topo"; aparece só depois de rolar bastante. Ao chegar no fim da página ele para logo acima do rodapé,
 * em vez de cobri-lo. Fica centralizado no rodapé, no computador e no celular
 * (no celular o botão de feedback fica na lateral direita, então não se sobrepõem).
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = document.querySelector("footer");
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER);
      const el = wrapper.current;
      if (!el || !footer) return;
      // onde o botão ficaria sem deslocamento (a posição atual já inclui o deslocamento anterior) e quanto passa do topo do rodapé
      const lift = parseFloat(el.style.getPropertyValue("--fab-lift")) || 0;
      const resting = el.getBoundingClientRect().bottom + lift;
      const limit = footer.getBoundingClientRect().top - FOOTER_GAP;
      el.style.setProperty("--fab-lift", `${Math.max(0, resting - limit)}px`);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // a posição de repouso (bottom) anima quando a barra de compra aparece; recalcula quando termina
    wrapper.current?.addEventListener("transitionend", onScroll);
    const el = wrapper.current;
    return () => {
      el?.removeEventListener("transitionend", onScroll);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function toTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    // faixa fixa no rodapé só para centralizar; o clique passa direto, exceto no botão
    <div ref={wrapper} className="fab-top pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center">
      <button
        type="button"
        onClick={toTop}
        aria-label="Voltar ao topo"
        tabIndex={visible ? 0 : -1}
        className={`flex h-11 items-center justify-center gap-2 rounded-full border border-accent-line bg-surface font-display text-sm font-semibold uppercase tracking-wider text-accent shadow-[var(--float-shadow)] px-5 transition duration-200 hover:bg-accent hover:text-accent-ink ${
          visible ? "pointer-events-auto translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
        </svg>
        <span>Voltar ao topo</span>
      </button>
    </div>
  );
}
