"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Linha de itens que rola na horizontal, sem barra de rolagem. No computador aparecem setas nas pontas; no celular a
 * pessoa arrasta, e um esmaecido na borda mostra que há mais conteúdo para aquele lado.
 */
export function ScrollRow({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  const scroll = (direction: 1 | -1) => ref.current?.scrollBy({ left: direction * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="relative">
      <ul
        ref={ref}
        onScroll={update}
        aria-label={label}
        className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>

      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 -left-4 w-10 bg-gradient-to-r from-bg to-transparent transition-opacity sm:left-0 ${edge.left ? "opacity-100" : "opacity-0"}`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 -right-4 w-14 bg-gradient-to-l from-bg to-transparent transition-opacity sm:right-0 ${edge.right ? "opacity-100" : "opacity-0"}`}
      />

      {(["left", "right"] as const).map((side) => (
        <button
          key={side}
          type="button"
          onClick={() => scroll(side === "left" ? -1 : 1)}
          aria-label={side === "left" ? "Rolar para a esquerda" : "Rolar para a direita"}
          tabIndex={edge[side] ? 0 : -1}
          className={`absolute top-[38%] z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-surface text-text shadow-lg shadow-black/50 transition hover:border-accent-line hover:text-accent [@media(hover:hover)]:flex ${
            side === "left" ? "-left-5" : "-right-5"
          } ${edge[side] ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
          </svg>
        </button>
      ))}
    </div>
  );
}
