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
    // sem borda nem fundo para não competir com o desconto e o preço; o "Hypar" (com a contagem, se já houver) só aparece ao passar o mouse
    return (
      <button
        type="button"
        aria-pressed={hyped}
        aria-label={label}
        onClick={hype}
        className={`group/hype absolute bottom-3 right-3 grid size-7 place-items-center rounded-full transition ${
          hyped ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft hover:text-accent"
        }`}
      >
        <Icon name="rocket" className="size-4" />
        <span className="pointer-events-none absolute bottom-full right-0 mb-1 whitespace-nowrap rounded-[4px] border border-line bg-surface px-1.5 py-0.5 text-[11px] font-medium text-text-2 opacity-0 transition-opacity duration-150 group-hover/hype:opacity-100 group-focus-visible/hype:opacity-100">
          Hypar{shown >= HYPE_MIN_SHOWN && <span className="tabular"> · {number.format(shown)}</span>}
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
