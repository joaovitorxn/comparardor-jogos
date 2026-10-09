import Link from "next/link";
import { formatCents } from "@/lib/format";
import { getStore } from "@/lib/stores";
import type { CardData } from "./game-card";
import { CoverImage } from "./cover-image";
import { StoreLogo } from "./store-logo";
import { DiscountBadge } from "./ui";

/**
 * Lista de preços: o preço é o assunto, então ele ocupa o lado direito em letras grandes e a capa vira miniatura.
 * Quebra o ritmo das grades de pôsteres da home e deixa comparar valores de relance.
 */
export function PriceList({ games }: { games: CardData[] }) {
  return (
    <ul className="grid gap-x-6 md:grid-cols-2 xl:grid-cols-3">
      {games.map(({ game, bestPriceCents, regularPriceCents, maxDiscount, bestStore }) => {
        const discounted = regularPriceCents != null && bestPriceCents != null && regularPriceCents > bestPriceCents;
        return (
          <li key={game.id} className="border-b border-line">
            <Link href={`/jogo/${game.slug}`} className="group flex items-center gap-3 py-2.5">
              <span className="relative aspect-[2/3] w-11 shrink-0 overflow-hidden rounded-[3px] bg-surface-2">
                <CoverImage src={game.coverUrl} title={game.title} sizes="44px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-sm font-medium leading-5 group-hover:text-accent">{game.title}</span>
                {bestStore && (
                  <span className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                    <StoreLogo store={bestStore} size={16} />
                    {getStore(bestStore)?.name ?? bestStore}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                {bestPriceCents != null && (
                  <span className="tabular font-display text-2xl font-bold leading-none text-text">{bestPriceCents === 0 ? "Grátis" : formatCents(bestPriceCents)}</span>
                )}
                <span className="flex items-center gap-1.5">
                  {discounted && <span className="tabular text-[11px] leading-none text-muted line-through">{formatCents(regularPriceCents)}</span>}
                  {maxDiscount > 0 && <DiscountBadge percent={maxDiscount} size="sm" />}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
