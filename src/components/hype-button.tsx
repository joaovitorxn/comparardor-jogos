"use client";

import { useEffect, useRef, useState } from "react";
import { HYPE_MIN_SHOWN } from "@/lib/hype";
import { useHype } from "@/lib/use-hype";
import { Icon } from "./icon";

const number = new Intl.NumberFormat("pt-BR");

/** Quanto tempo o "Hypado!" (ou "Hype desfeito") fica à mostra depois do clique (no celular não existe hover, então ele aparece sozinho). */
const FLASH_MS = 1800;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** O foguete decola para o canto, some e volta ao lugar. */
function launch(el: HTMLElement | null) {
  if (!el || reducedMotion()) return;
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

/** Ao desfazer, o foguete só encolhe e volta (sem festa). */
function shrink(el: HTMLElement | null) {
  if (!el || reducedMotion()) return;
  el.animate([{ transform: "scale(1)" }, { transform: "scale(0.55)", opacity: 0.4, offset: 0.4 }, { transform: "scale(1)" }], { duration: 350, easing: "ease-out" });
}

/**
 * Comemoração do hype: faíscas verdes saem do botão em todas as direções e a borda do card pulsa. Tudo é criado na hora e some
 * sozinho (nada fica na página); quem pediu menos movimento não vê nada disso.
 */
function celebrate(button: HTMLElement | null) {
  if (!button || reducedMotion()) return;
  const sparks = 12;
  for (let i = 0; i < sparks; i++) {
    const spark = document.createElement("span");
    spark.setAttribute("aria-hidden", "true");
    spark.style.cssText = "position:absolute;left:50%;top:50%;width:5px;height:5px;margin:-2.5px;border-radius:9999px;background:var(--accent);pointer-events:none";
    button.appendChild(spark);
    const angle = (i / sparks) * Math.PI * 2 + Math.random() * 0.4;
    const distance = 26 + Math.random() * 20;
    spark
      .animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: 1 },
          { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`, opacity: 0 },
        ],
        { duration: 550 + Math.random() * 250, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
      )
      .finished.then(
        () => spark.remove(),
        () => spark.remove(),
      );
  }
  // brilho verde que se abre em volta do card
  button.parentElement?.querySelector<HTMLElement>("[data-hype-glow]")?.animate(
    [
      { boxShadow: "0 0 0 0 color-mix(in srgb, var(--accent) 60%, transparent)", borderColor: "var(--accent)" },
      { boxShadow: "0 0 0 12px color-mix(in srgb, var(--accent) 0%, transparent)" },
    ],
    { duration: 800, easing: "ease-out" },
  );
}

type Flash = "hype" | "undo" | null;

/**
 * Botão "Hypar": o visitante diz que a promoção está valendo muito. Um voto por jogo neste navegador; clicar de novo
 * desfaz. Ao votar o foguete decola, saem faíscas e a borda do card pulsa; o rótulo ("Hypado!") aparece por um instante.
 * `variant="card"` é a pílula que surge sobre a capa quando o mouse está no card; `"page"` é o botão da página do jogo.
 */
export function HypeButton({ gameId, count, variant }: { gameId: number; count: number; variant: "card" | "page" }) {
  const { hyped, hype, unhype } = useHype(gameId);
  const [flash, setFlash] = useState<Flash>(null);
  // quem votou ou desfez vê a conta mudar na hora; os números da página só se atualizam na próxima geração dela
  const [delta, setDelta] = useState(0);
  const rocket = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const shown = Math.max(0, count + delta);
  const label = hyped ? "Você hypou esta promoção. Clique para desfazer" : "Hypar: esta promoção está valendo muito";

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash]);

  function onClick() {
    if (hyped) {
      unhype();
      shrink(rocket.current);
      setDelta((d) => d - 1);
      setFlash("undo");
      return;
    }
    hype();
    launch(rocket.current);
    celebrate(button.current);
    setDelta((d) => d + 1);
    setFlash("hype");
  }

  const text = flash === "hype" ? "Hypado!" : flash === "undo" ? "Hype desfeito" : hyped ? "Hypado" : "Hypar";
  const icon = (
    <span ref={rocket} className="inline-flex">
      <Icon name="rocket" className="size-4" />
    </span>
  );

  if (variant === "card") {
    // só no computador e só com o mouse sobre o card (o celular não tem hover e a tela é pequena: lá o Hypar fica na página do jogo)
    return (
      <button
        ref={button}
        type="button"
        aria-pressed={hyped}
        aria-label={label}
        title={hyped ? "Clique para desfazer" : undefined}
        onClick={onClick}
        className={`group/hype absolute right-2 top-2 z-10 inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium backdrop-blur-sm transition duration-150 [@media(hover:none)]:hidden focus-visible:opacity-100 group-hover/card:opacity-100 ${
          flash ? "opacity-100" : "opacity-0"
        } ${hyped ? "border-accent-line bg-accent-soft text-accent" : "border-line-strong bg-bg/75 text-text-2 hover:border-accent hover:text-accent"}`}
      >
        {icon}
        <span>{text}</span>
        {!flash && shown >= HYPE_MIN_SHOWN && <span className="tabular text-text-2">{number.format(shown)}</span>}
      </button>
    );
  }

  return (
    <button
      ref={button}
      type="button"
      aria-pressed={hyped}
      aria-label={label}
      title={hyped ? "Clique para desfazer" : "Hypar"}
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 rounded-[4px] border px-3 py-1.5 text-sm font-medium transition max-md:min-h-11 ${
        hyped ? "border-accent-line bg-accent-soft text-accent" : "border-line-strong bg-bg/60 text-text hover:border-accent hover:text-accent"
      }`}
    >
      {icon}
      {text}
      {shown >= HYPE_MIN_SHOWN && <span className="tabular text-text-2">{number.format(shown)}</span>}
    </button>
  );
}
