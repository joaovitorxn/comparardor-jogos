import { inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { GameGrid } from "@/components/game-card";
import { ListToolbar } from "@/components/list-toolbar";
import { OfferList, OfferTable } from "@/components/offer-views";
import { Pagination, parsePage } from "@/components/pagination";
import { PlatformNotice } from "@/components/platform-notice";
import { SearchForm } from "@/components/search-form";
import { SteamResultCard } from "@/components/steam-result-card";
import { SectionHeader } from "@/components/ui";
import { searchSteamGames, type SteamStoreItem } from "@/collectors/steam";
import { db } from "@/db";
import { games } from "@/db/schema";
import { fromSearchDoc } from "@/lib/list-items";
import { hasFilters, listHref, parseListParams, type SortId } from "@/lib/list-params";
import { LAYOUT_COOKIE, LAYOUTS, parseLayout } from "@/lib/offers-layout";
import { parsePlatforms, PLATFORMS_COOKIE } from "@/lib/platform-selection";
import { STORES, type PlatformFamilyId } from "@/lib/stores";
import { searchCatalog, type SearchSort } from "@/services/search";

export async function generateMetadata(props: PageProps<"/busca">): Promise<Metadata> {
  const { q } = await props.searchParams;
  return { title: typeof q === "string" && q ? `Busca: ${q}` : "Explorar jogos", robots: { index: false } };
}

/** Ordenação da tela → ordenação do índice de busca. */
const SEARCH_SORT: Record<SortId, SearchSort> = {
  relevancia: "relevancia",
  desconto: "maior-desconto",
  preco: "menor-preco",
  nota: "nota",
  az: "az",
};

export default async function SearchPage(props: PageProps<"/busca">) {
  const searchParams = await props.searchParams;
  const params = parseListParams(searchParams);
  const page = parsePage(searchParams.pagina);

  const jar = await cookies();
  // forma de ver a lista (a mesma escolha das Ofertas), lembrada neste aparelho
  const layout = parseLayout(jar.get(LAYOUT_COOKIE)?.value);
  const pageSize = LAYOUTS.find((l) => l.id === layout)!.pageSize;

  // filtro explícito da página vale mais; senão, valem as plataformas escolhidas no cabeçalho
  const mine = parsePlatforms(jar.get(PLATFORMS_COOKIE)?.value);
  const platforms: PlatformFamilyId[] = params.plataforma ? [params.plataforma as PlatformFamilyId] : mine;
  const filtered = hasFilters(params);

  const [result, steam] = await Promise.all([
    searchCatalog(
      {
        q: params.q,
        platforms,
        maxCents: params.ate ? Number(params.ate) * 100 : undefined,
        minDiscount: params.desconto ? Number(params.desconto) : undefined,
        store: params.loja || undefined,
        genre: params.genero || undefined,
        sort: SEARCH_SORT[params.ordem],
      },
      { limit: pageSize, offset: (page - 1) * pageSize },
    ),
    // jogos fora do catálogo vêm da Steam — só na 1ª página e sem filtros (que a Steam não sabe aplicar)
    params.q && page === 1 && !filtered
      ? searchSteamGames(params.q).then(
          (items) => ({ items, error: false }),
          () => ({ items: [] as SteamStoreItem[], error: true }),
        )
      : Promise.resolve({ items: [] as SteamStoreItem[], error: false }),
  ]);

  const steamIds = steam.items.map((s) => s.appId);
  const known = steamIds.length
    ? new Set((await db.select({ id: games.steamAppId }).from(games).where(inArray(games.steamAppId, steamIds))).map((g) => g.id))
    : new Set<number | null>();
  const fromSteam = steam.items.filter((s) => !known.has(s.appId));
  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));

  const title = params.q ? (result.total || fromSteam.length ? `Resultados para “${params.q}”` : `Nada encontrado para “${params.q}”`) : "Explorar jogos";
  const items = result.items.map((d) => fromSearchDoc(d, platforms));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SearchForm defaultValue={params.q} size="lg" className="mb-8 max-w-2xl" />
      <PlatformNotice platforms={params.plataforma ? [] : mine} />

      <SectionHeader title={title} aside={`${result.total} ${result.total === 1 ? "jogo" : "jogos"} no catálogo`} />
      <ListToolbar base="/busca" params={params} layout={layout} genres={result.facets.genres.map((g) => g.value)} stores={Object.keys(STORES)} />

      {items.length === 0 ? (
        <p className="rounded-card border border-dashed border-line p-6 text-sm text-text-2">
          {filtered ? "Nenhum jogo com esses filtros. Tente remover algum." : "Nenhum jogo do catálogo combina com a busca."}
        </p>
      ) : layout === "lista" ? (
        <OfferList items={items} />
      ) : layout === "tabela" ? (
        <OfferTable items={items} firstRank={(page - 1) * pageSize + 1} />
      ) : (
        <GameGrid games={items} dense={layout === "compacto"} />
      )}
      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => listHref("/busca", params, {}, p)} />

      {(fromSteam.length > 0 || steam.error) && (
        <section className="mt-12">
          <SectionHeader title="Mais na Steam" aside="Ainda não comparados · as outras lojas são buscadas ao abrir" />
          {steam.error ? (
            <p className="text-sm text-text-2">Não foi possível consultar a Steam agora. Tente de novo em instantes.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4 xl:grid-cols-5">
              {fromSteam.map((item) => (
                <SteamResultCard key={item.appId} item={item} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
