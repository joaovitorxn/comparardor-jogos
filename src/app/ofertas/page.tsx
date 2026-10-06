import type { Metadata } from "next";
import { cookies } from "next/headers";
import { GameGrid } from "@/components/game-card";
import { ListToolbar } from "@/components/list-toolbar";
import { OfferList, OfferTable } from "@/components/offer-views";
import { Pagination, parsePage } from "@/components/pagination";
import { PlatformNotice } from "@/components/platform-notice";
import { SectionHeader } from "@/components/ui";
import { getDealPool, rankDeals } from "@/db/queries";
import { filterDeals, fromSummary, sortDeals, topGenres } from "@/lib/list-items";
import { hasFilters, listHref, parseListParams, SORTS } from "@/lib/list-params";
import { LAYOUT_COOKIE, LAYOUTS, parseLayout } from "@/lib/offers-layout";
import { parsePlatforms, PLATFORMS_COOKIE } from "@/lib/platform-selection";
import { STORES, type PlatformFamilyId } from "@/lib/stores";

export const metadata: Metadata = {
  title: "Ofertas",
  alternates: { canonical: "/ofertas" },
  description: "Promoções de jogos que valem a pena agora, comparando Steam, GOG, Epic, Nuuvem, Green Man Gaming, Microsoft Store e consoles.",
};

export default async function DealsPage(props: PageProps<"/ofertas">) {
  const searchParams = await props.searchParams;
  const params = parseListParams(searchParams);
  const page = parsePage(searchParams.pagina);

  const jar = await cookies();
  // forma de ver a lista (cards, compacto, lista ou tabela), lembrada neste aparelho
  const layout = parseLayout(jar.get(LAYOUT_COOKIE)?.value);
  const pageSize = LAYOUTS.find((l) => l.id === layout)!.pageSize;
  const offset = (page - 1) * pageSize;

  // plataforma escolhida no filtro da página vale mais; senão, as marcadas no cabeçalho (todas, se nenhuma)
  const mine = parsePlatforms(jar.get(PLATFORMS_COOKIE)?.value);
  const platforms: PlatformFamilyId[] = params.plataforma ? [params.plataforma as PlatformFamilyId] : mine;
  const pool = await getDealPool(platforms);
  const deals = filterDeals(pool, params);
  const ranked = params.ordem === "relevancia" ? rankDeals(deals) : sortDeals(deals, params.ordem);
  const items = ranked.slice(offset, offset + pageSize).map(fromSummary);
  const total = ranked.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SectionHeader title="Ofertas" icon="tag" aside={`${total} jogos com desconto · ${SORTS.find((s) => s.id === params.ordem)!.hint}`} />
      <PlatformNotice platforms={params.plataforma ? [] : mine} />
      <ListToolbar base="/ofertas" params={params} layout={layout} genres={topGenres(pool)} stores={Object.keys(STORES)} />
      {!items.length ? (
        <p className="rounded-card border border-dashed border-line p-6 text-sm text-text-2">
          {hasFilters(params) ? "Nenhuma oferta com esses filtros. Tente remover algum." : "Nenhuma oferta nesta página."}
        </p>
      ) : layout === "lista" ? (
        <OfferList items={items} />
      ) : layout === "tabela" ? (
        <OfferTable items={items} firstRank={offset + 1} />
      ) : (
        <GameGrid games={items} dense={layout === "compacto"} />
      )}
      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => listHref("/ofertas", params, {}, p)} />
    </div>
  );
}
