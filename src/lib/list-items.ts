import type { GameSummary } from "@/db/queries";
import type { Platform } from "@/db/schema";
import type { SearchDoc } from "@/services/search";
import { bestPriceFor } from "@/services/search";
import type { ListParams, SortId } from "./list-params";
import { PLATFORM_FAMILIES, type PlatformFamilyId } from "./stores";

/** O que as visões de lista (cards, compacto, lista, tabela) precisam de cada jogo — vem das ofertas ou da busca. */
export interface ListItem {
  game: { id: number; slug: string; title: string; coverUrl: string | null };
  bestPriceCents: number | null;
  regularPriceCents: number | null;
  maxDiscount: number;
  storeCount: number;
  bestStore: string | null;
  bestPlatform: Platform | null;
  families: PlatformFamilyId[];
  rating: number | null;
  historyLowCents: number | null;
}

export function fromSummary(s: GameSummary): ListItem {
  const { game } = s;
  return {
    game: { id: game.id, slug: game.slug, title: game.title, coverUrl: game.coverUrl },
    bestPriceCents: s.bestPriceCents,
    regularPriceCents: s.regularPriceCents,
    maxDiscount: s.maxDiscount,
    storeCount: s.storeCount,
    bestStore: s.bestStore,
    bestPlatform: s.bestPlatform,
    families: s.families,
    rating: game.criticRating ?? game.metacritic,
    historyLowCents: game.historyLowCents,
  };
}

/** Resultado da busca → item de lista, com o preço das plataformas escolhidas. */
export function fromSearchDoc(doc: SearchDoc, platforms: PlatformFamilyId[]): ListItem {
  const price = bestPriceFor(doc, platforms);
  return {
    game: { id: doc.id, slug: doc.slug, title: doc.title, coverUrl: doc.coverUrl },
    bestPriceCents: price?.cents ?? null,
    regularPriceCents: price?.regularCents ?? null,
    maxDiscount: price?.discountPercent ?? 0,
    storeCount: doc.stores.length,
    bestStore: price?.store ?? null,
    bestPlatform: price?.platform ?? null,
    families: PLATFORM_FAMILIES.map((f) => f.id).filter((id) => doc.prices[id] && (!platforms.length || platforms.includes(id))),
    rating: doc.rating,
    historyLowCents: doc.historyLowCents,
  };
}

/** Aplica os filtros de preço, desconto, loja e gênero às promoções (a plataforma já vem no recorte do conjunto). */
export function filterDeals(deals: GameSummary[], p: ListParams): GameSummary[] {
  const maxCents = p.ate ? Number(p.ate) * 100 : null;
  const minDiscount = p.desconto ? Number(p.desconto) : null;
  return deals.filter(
    (s) =>
      (maxCents == null || (s.bestPriceCents != null && s.bestPriceCents <= maxCents)) &&
      (minDiscount == null || s.maxDiscount >= minDiscount) &&
      (!p.loja || s.stores.includes(p.loja)) &&
      (!p.genero || s.game.genres.includes(p.genero)),
  );
}

/** Ordenações das promoções que não são "relevância" (essa usa o ranking de destaque). */
export function sortDeals(deals: GameSummary[], sort: Exclude<SortId, "relevancia">): GameSummary[] {
  const price = (s: GameSummary) => s.bestPriceCents ?? Infinity;
  const rating = (s: GameSummary) => s.game.criticRating ?? s.game.metacritic ?? -1;
  const byDiscount = (a: GameSummary, b: GameSummary) => b.maxDiscount - a.maxDiscount || price(a) - price(b);
  const sorted = [...deals];
  switch (sort) {
    case "desconto":
      return sorted.sort(byDiscount);
    case "preco":
      return sorted.filter((s) => (s.bestPriceCents ?? 0) > 0).sort((a, b) => price(a) - price(b) || b.maxDiscount - a.maxDiscount);
    case "nota":
      return sorted.sort((a, b) => rating(b) - rating(a) || byDiscount(a, b));
    case "az":
      return sorted.sort((a, b) => a.game.title.localeCompare(b.game.title, "pt-BR"));
  }
}

/** Gêneros mais comuns entre as promoções, para o filtro de gênero (como na busca). */
export function topGenres(deals: GameSummary[], limit = 14): string[] {
  const counts = new Map<string, number>();
  for (const s of deals) for (const g of s.game.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([g]) => g);
}
