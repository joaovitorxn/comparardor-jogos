import Link from "next/link";
import { formatCents } from "@/lib/format";
import { getStore } from "@/lib/stores";
import { CoverImage } from "./cover-image";
import { StoreLogo } from "./store-logo";
import { DiscountBadge } from "./ui";

/** O que o card precisa — vem tanto do catálogo (GameSummary) quanto da busca (SearchDoc). */
export interface CardData {
  game: { id: number; slug: string; title: string; coverUrl: string | null };
  bestPriceCents: number | null;
  regularPriceCents: number | null;
  maxDiscount: number;
  storeCount: number;
  bestStore: string | null;
}

export function GameCard({ summary, releaseLabel }: { summary: CardData; releaseLabel?: string }) {
  const { game, bestPriceCents, regularPriceCents, maxDiscount, storeCount, bestStore } = summary;
  const discounted = regularPriceCents != null && bestPriceCents != null && regularPriceCents > bestPriceCents;

  return (
    <Link
      href={`/jogo/${game.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-accent-line"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-surface-2">
        <CoverImage
          src={game.coverUrl}
          title={game.title}
          sizes="(min-width: 1280px) 220px, (min-width: 768px) 22vw, 45vw"
          className="transition duration-500 group-hover:scale-[1.03]"
        />
        {maxDiscount > 0 && (
          <span className="absolute left-0 top-3">
            <DiscountBadge percent={maxDiscount} className="rounded-l-none pl-2" />
          </span>
        )}
        {releaseLabel && (
          <span className="absolute inset-x-0 bottom-0 bg-bg/85 px-2.5 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-accent backdrop-blur-sm">
            {releaseLabel}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-text group-hover:text-accent">{game.title}</p>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="min-w-0">
            {bestPriceCents == null ? (
              <span className="text-sm text-muted">Sem preço</span>
            ) : (
              <>
                {discounted && <p className="tabular text-[11px] leading-none text-muted line-through">{formatCents(regularPriceCents!)}</p>}
                <p className="tabular font-display text-xl font-bold leading-tight text-text">
                  {bestPriceCents === 0 ? "Grátis" : formatCents(bestPriceCents)}
                </p>
              </>
            )}
          </div>
          {bestStore && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted" title={`Menor preço na ${getStore(bestStore)?.name ?? bestStore}`}>
              {storeCount > 1 && <span className="tabular">{storeCount} lojas</span>}
              <StoreLogo store={bestStore} size={22} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function GameGrid({ games, releaseLabel }: { games: CardData[]; releaseLabel?: (game: CardData) => string | undefined }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4 xl:grid-cols-6">
      {games.map((s) => (
        <GameCard key={s.game.id} summary={s} releaseLabel={releaseLabel?.(s)} />
      ))}
    </div>
  );
}
