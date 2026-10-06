import Link from "next/link";
import { formatCents } from "@/lib/format";
import type { ListItem } from "@/lib/list-items";
import { priceRarity } from "@/lib/rarity";
import { getStore, PLATFORM_FAMILIES, PLATFORM_LABELS } from "@/lib/stores";
import { CoverImage } from "./cover-image";
import { PlatformIcon, StoreLogo } from "./store-logo";
import { DiscountBadge, MetacriticBadge, PriceText, RarityTag } from "./ui";

const familyLabel = (id: string) => PLATFORM_FAMILIES.find((f) => f.id === id)?.label ?? id;

function Platforms({ item }: { item: ListItem }) {
  return (
    <span className="flex items-center gap-1.5 text-text-2" title={item.families.map(familyLabel).join(", ")}>
      {item.families.map((id) => (
        <PlatformIcon key={id} family={id} className="size-4" />
      ))}
    </span>
  );
}

function Prices({ item }: { item: ListItem }) {
  const discounted = item.regularPriceCents != null && item.bestPriceCents != null && item.regularPriceCents > item.bestPriceCents;
  return (
    <span className="flex flex-col items-end">
      {discounted && <span className="tabular text-xs text-muted line-through">{formatCents(item.regularPriceCents!)}</span>}
      {item.bestPriceCents != null &&
        (item.bestPriceCents === 0 ? (
          <span className="font-display text-xl font-bold">Grátis</span>
        ) : (
          <PriceText cents={item.bestPriceCents} className="font-display text-xl font-bold" />
        ))}
    </span>
  );
}

/** Uma linha por jogo: capa pequena, nome, plataformas e loja, selos e preço. */
export function OfferList({ items }: { items: ListItem[] }) {
  return (
    <ul className="overflow-hidden rounded-card border border-line bg-surface">
      {items.map((item) => {
        const rarity = priceRarity(item.maxDiscount);
        const store = item.bestStore ? getStore(item.bestStore)?.name : null;
        return (
          <li key={item.game.id} className="border-b border-line last:border-b-0">
            <Link href={`/jogo/${item.game.slug}`} className="group flex items-center gap-3 px-3 py-2.5 transition hover:bg-surface-2 sm:gap-4 sm:px-4">
              <span className="relative h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-[3px] bg-surface-2">
                <CoverImage src={item.game.coverUrl} title={item.game.title} sizes="48px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium group-hover:text-accent">{item.game.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <Platforms item={item} />
                  {item.bestStore && (
                    <span className="flex items-center gap-1.5">
                      <StoreLogo store={item.bestStore} size={18} />
                      {store}
                      {item.storeCount > 1 && <span className="tabular whitespace-nowrap">· {item.storeCount} lojas</span>}
                    </span>
                  )}
                </span>
              </span>
              {rarity && (
                <span className="hidden md:block">
                  <RarityTag rarity={rarity} />
                </span>
              )}
              {item.maxDiscount > 0 && (
                <span className="hidden sm:block">
                  <DiscountBadge percent={item.maxDiscount} size="lg" />
                </span>
              )}
              <span className="flex shrink-0 flex-col items-end gap-1 sm:w-28">
                {/* no celular o desconto fica em cima do preço, para o título ter espaço */}
                {item.maxDiscount > 0 && (
                  <span className="sm:hidden">
                    <DiscountBadge percent={item.maxDiscount} size="sm" />
                  </span>
                )}
                <Prices item={item} />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Tabela detalhada: tudo lado a lado para comparar jogos rapidamente. */
export function OfferTable({ items, firstRank }: { items: ListItem[]; firstRank: number }) {
  const head = "px-3 py-2.5 text-left font-display text-xs font-semibold uppercase tracking-wider text-muted";
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-[40rem] text-sm">
        <thead className="border-b border-line">
          <tr>
            <th className={`${head} w-12 text-right`}>#</th>
            <th className={head}>Jogo</th>
            <th className={`${head} hidden md:table-cell`}>Plataformas</th>
            <th className={head}>Melhor loja</th>
            <th className={`${head} hidden lg:table-cell`}>Nota</th>
            <th className={`${head} text-right`}>Preço normal</th>
            <th className={`${head} text-center`}>Desconto</th>
            <th className={`${head} text-right`}>Preço</th>
            <th className={`${head} hidden xl:table-cell`}>Faixa</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const rating = item.rating;
            const rarity = priceRarity(item.maxDiscount);
            const atLow =
              item.bestPriceCents != null && item.historyLowCents != null && item.historyLowCents > 0 && item.bestPriceCents <= item.historyLowCents;
            const discounted = item.regularPriceCents != null && item.bestPriceCents != null && item.regularPriceCents > item.bestPriceCents;
            return (
              <tr key={item.game.id} className="group border-b border-line transition last:border-b-0 hover:bg-surface-2">
                <td className="tabular px-3 py-2 text-right font-display text-base font-bold text-muted">{firstRank + i}</td>
                <td className="px-3 py-2">
                  <Link href={`/jogo/${item.game.slug}`} className="flex items-center gap-3">
                    <span className="relative h-12 w-8 shrink-0 overflow-hidden rounded-[3px] bg-surface-2">
                      <CoverImage src={item.game.coverUrl} title={item.game.title} sizes="32px" />
                    </span>
                    <span className="max-w-[16rem] truncate font-medium group-hover:text-accent">{item.game.title}</span>
                  </Link>
                </td>
                <td className="hidden px-3 py-2 md:table-cell">
                  <Platforms item={item} />
                </td>
                <td className="px-3 py-2">
                  {item.bestStore ? (
                    <span className="flex items-center gap-2 whitespace-nowrap text-text-2" title={item.bestPlatform ? PLATFORM_LABELS[item.bestPlatform] : undefined}>
                      <StoreLogo store={item.bestStore} size={22} />
                      <span className="hidden sm:inline">{getStore(item.bestStore)?.name}</span>
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="hidden px-3 py-2 lg:table-cell">
                  {rating != null ? <MetacriticBadge score={rating} label="Nota da crítica" /> : <span className="text-muted">—</span>}
                </td>
                <td className="tabular px-3 py-2 text-right text-muted">{discounted ? <span className="line-through">{formatCents(item.regularPriceCents!)}</span> : "—"}</td>
                <td className="px-3 py-2 text-center">{item.maxDiscount > 0 ? <DiscountBadge percent={item.maxDiscount} /> : "—"}</td>
                <td className="px-3 py-2 text-right">
                  {item.bestPriceCents == null ? (
                    "—"
                  ) : item.bestPriceCents === 0 ? (
                    <span className="font-display text-lg font-bold text-accent">Grátis</span>
                  ) : (
                    <PriceText cents={item.bestPriceCents} className="font-display text-lg font-bold text-accent" />
                  )}
                </td>
                <td className="hidden px-3 py-2 xl:table-cell">
                  <span className="flex flex-wrap items-center gap-1.5">
                    {rarity && <RarityTag rarity={rarity} />}
                    {atLow && (
                      <span className="rounded-[3px] border border-accent-line bg-accent-soft px-1.5 py-px text-[11px] font-medium leading-4 text-accent">Piso histórico</span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
