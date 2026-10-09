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
    // só no computador e só com o mouse sobre o card (o celular não tem hover e a tela é pequena: lá o Hypar fica na página do jogo)
    return (
      <button
        type="button"
        aria-pressed={hyped}
        aria-label={label}
        onClick={onClick}
        className={`group/hype absolute right-2 top-2 z-10 inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium backdrop-blur-sm transition duration-150 [@media(hover:none)]:hidden focus-visible:opacity-100 group-hover/card:opacity-100 ${
          flash ? "opacity-100" : "opacity-0"
        } ${hyped ? "border-accent-line bg-accent-soft text-accent" : "border-line-strong bg-bg/75 text-text-2 hover:border-accent hover:text-accent"}`}
      >
        {icon}
        <span>{tip}</span>
        {!flash && shown >= HYPE_MIN_SHOWN && <span className="tabular text-text-2">{number.format(shown)}</span>}
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
