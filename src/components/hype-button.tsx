"use client";

import { HYPE_MIN_SHOWN } from "@/lib/hype";
import { useHype } from "@/lib/use-hype";
import { Icon } from "./icon";

const number = new Intl.NumberFormat("pt-BR");

/**
 * Botão "Hypar": o visitante diz que a promoção está valendo muito. Discreto: só o foguete, com "Hypar" aparecendo ao passar
 * o mouse. Um voto por jogo neste navegador. `variant="card"` é o botãozinho sobre a capa; `"page"` é o da página do jogo.
 */
export function HypeButton({ gameId, count, variant }: { gameId: number; count: number; variant: "card" | "page" }) {
  const { hyped, hype } = useHype(gameId);
  // quem acabou de votar vê o próprio voto somado; os dados da página só o incluem depois de atualizar
  const shown = count + (hyped && count === 0 ? 1 : 0);
  const label = hyped ? "Você hypou esta promoção" : "Hypar: esta promoção está valendo muito";

  if (variant === "card") {
    return (
      <button
        type="button"
        aria-pressed={hyped}
        aria-label={label}
        onClick={hype}
        className={`group/hype absolute right-2 top-2 inline-flex h-8 items-center gap-1 rounded-full border px-2 text-xs backdrop-blur-sm transition ${
          hyped ? "border-accent-line bg-accent-soft text-accent" : "border-line-strong bg-bg/70 text-text-2 hover:border-accent hover:text-accent"
        }`}
      >
        <Icon name="rocket" className="size-4 shrink-0" />
        {shown >= HYPE_MIN_SHOWN && <span className="tabular font-semibold">{number.format(shown)}</span>}
        <span className="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/hype:max-w-16 group-hover/hype:opacity-100 group-focus-visible/hype:max-w-16 group-focus-visible/hype:opacity-100">
          Hypar
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
      onClick={hype}
      className={`inline-flex items-center gap-2 rounded-[4px] border px-3 py-1.5 text-sm font-medium transition max-md:min-h-11 ${
        hyped ? "border-accent-line bg-accent-soft text-accent" : "border-line-strong bg-bg/60 text-text hover:border-accent hover:text-accent"
      }`}
    >
      <Icon name="rocket" className="size-4" />
      {hyped ? "Hypado" : "Hypar"}
      {shown >= HYPE_MIN_SHOWN && <span className="tabular text-text-2">{number.format(shown)}</span>}
    </button>
  );
}
