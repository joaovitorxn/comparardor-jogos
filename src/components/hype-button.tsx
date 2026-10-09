"use client";

import { useEffect, useRef, useState } from "react";
import { HYPE_MIN_SHOWN } from "@/lib/hype";
import { useHype } from "@/lib/use-hype";
import { Icon } from "./icon";

const number = new Intl.NumberFormat("pt-BR");

/** Quanto tempo o "Hypado!" fica à mostra depois do clique (no celular não existe hover, então ele aparece sozinho). */
const FLASH_MS = 1800;

/** O foguete decola para o canto, some e volta ao lugar. Quem pediu menos movimento não vê a animação. */
function launch(el: HTMLElement | null) {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: "translate(7px, -10px) scale(1.3)", opacity: 0, offset: 0.55 },
      { transform: "translate(-6px, 9px) scale(0.8)", opacity: 0, offset: 0.56 },
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
    ],
    { duration: 700, easing: "ease-out" },
  );
}

/**
 * Botão "Hypar": o visitante diz que a promoção está valendo muito. Discreto: só o foguete, com "Hypar" aparecendo ao passar
 * o mouse. Um voto por jogo neste navegador; ao votar o foguete decola e aparece "Hypado!" por um instante.
 * `variant="card"` é o botãozinho do card; `"page"` é o da página do jogo.
 */
export function HypeButton({ gameId, count, variant }: { gameId: number; count: number; variant: "card" | "page" }) {
  const { hyped, hype } = useHype(gameId);
  const [flash, setFlash] = useState(false);
  const rocket = useRef<HTMLSpanElement>(null);
  // quem acabou de votar vê o próprio voto somado; os dados da página só o incluem depois de atualizar
  const shown = count + (hyped && count === 0 ? 1 : 0);
  const label = hyped ? "Você hypou esta promoção" : "Hypar: esta promoção está valendo muito";

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(false), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  function onClick() {
    if (hyped) return;
    hype();
    launch(rocket.current);
    setFlash(true);
  }

  const icon = (
    <span ref={rocket} className="inline-flex">
      <Icon name="rocket" className="size-4" />
    </span>
  );

  if (variant === "card") {
    const tip = flash ? "Hypado!" : hyped ? "Hypado" : "Hypar";
    // sem borda nem fundo para não competir com o desconto e o preço; o rótulo (com a contagem, se já houver) aparece no hover e logo após votar
    return (
      <button
        type="button"
        aria-pressed={hyped}
        aria-label={label}
        onClick={onClick}
        className={`group/hype absolute bottom-3 right-3 grid size-7 place-items-center rounded-full transition ${
          hyped ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft hover:text-accent"
        }`}
      >
        {icon}
        <span
          className={`pointer-events-none absolute bottom-full right-0 mb-1 whitespace-nowrap rounded-[4px] border px-1.5 py-0.5 text-[11px] font-medium transition-opacity duration-150 group-hover/hype:opacity-100 group-focus-visible/hype:opacity-100 ${
            flash ? "border-accent-line bg-accent-soft text-accent opacity-100" : "border-line bg-surface text-text-2 opacity-0"
          }`}
        >
          {tip}
          {!flash && shown >= HYPE_MIN_SHOWN && <span className="tabular"> · {number.format(shown)}</span>}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={hyped}
      aria-label={label}
      title="Hypar"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-[4px] border px-3 py-1.5 text-sm font-medium transition max-md:min-h-11 ${
        hyped ? "border-accent-line bg-accent-soft text-accent" : "border-line-strong bg-bg/60 text-text hover:border-accent hover:text-accent"
      }`}
    >
      {icon}
      {flash ? "Hypado!" : hyped ? "Hypado" : "Hypar"}
      {shown >= HYPE_MIN_SHOWN && <span className="tabular text-text-2">{number.format(shown)}</span>}
    </button>
  );
}
