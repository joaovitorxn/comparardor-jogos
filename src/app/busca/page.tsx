import { inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { GameGrid, type CardData } from "@/components/game-card";
import { PlatformNotice } from "@/components/platform-notice";
import { Pagination, parsePage } from "@/components/pagination";
import { SearchFilters } from "@/components/search-filters";
import { SearchForm } from "@/components/search-form";
import { SteamResultCard } from "@/components/steam-result-card";
import { SectionHeader } from "@/components/ui";
import { searchSteamGames, type SteamStoreItem } from "@/collectors/steam";
import { db } from "@/db";
import { games } from "@/db/schema";
import { parsePlatforms, PLATFORMS_COOKIE } from "@/lib/platform-selection";
import { DISCOUNTS, PRICE_CAPS, SORTS, type FilterValues } from "@/lib/search-options";
import { getStore, PLATFORM_FAMILIES, STORES, type PlatformFamilyId } from "@/lib/stores";
import { bestPriceFor, searchCatalog, type SearchDoc, type SearchSort } from "@/services/search";

const PAGE_SIZE = 30;
const FAMILY_IDS = new Set<string>(PLATFORM_FAMILIES.map((f) => f.id));
const SORT_IDS = new Set(SORTS.map((s) => s.value));

export async function generateMetadata(props: PageProps<"/busca">): Promise<Metadata> {
  const { q } = await props.searchParams;
  return { title: typeof q === "string" && q ? `Busca: ${q}` : "Explorar jogos", robots: { index: false } };
}

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

/** Resultado da busca → dados do card, com o preço da plataforma filtrada. */
function toCard(doc: SearchDoc, platforms: PlatformFamilyId[]): CardData {
  const price = bestPriceFor(doc, platforms);
  return {
    game: { id: doc.id, slug: doc.slug, title: doc.title, coverUrl: doc.coverUrl },
    bestPriceCents: price?.cents ?? null,
    regularPriceCents: price?.regularCents ?? null,
    maxDiscount: price?.discountPercent ?? 0,
    storeCount: doc.stores.length,
    bestStore: price?.store ?? null,
  };
}

export default async function SearchPage(props: PageProps<"/busca">) {
  const params = await props.searchParams;
  const values: FilterValues = {
    q: str(params.q).slice(0, 100),
    plataforma: FAMILY_IDS.has(str(params.plataforma)) ? str(params.plataforma) : "",
    ate: PRICE_CAPS.some((p) => p.value === str(params.ate)) ? str(params.ate) : "",
    desconto: DISCOUNTS.some((d) => d.value === str(params.desconto)) ? str(params.desconto) : "",
    loja: str(params.loja) in STORES ? str(params.loja) : "",
    genero: str(params.genero).slice(0, 60),
    ordem: SORT_IDS.has(str(params.ordem)) ? str(params.ordem) : "relevancia",
  };
  const page = parsePage(params.pagina);
  // filtro explícito da página vale mais; senão, valem as plataformas escolhidas no cabeçalho
  const mine = parsePlatforms((await cookies()).get(PLATFORMS_COOKIE)?.value);
  const platforms: PlatformFamilyId[] = values.plataforma ? [values.plataforma as PlatformFamilyId] : mine;
  const hasFilters = Boolean(values.plataforma || values.ate || values.desconto || values.loja || values.genero);

  const [result, steam] = await Promise.all([
    searchCatalog(
      {
        q: values.q,
        platforms,
        maxCents: values.ate ? Number(values.ate) * 100 : undefined,
        minDiscount: values.desconto ? Number(values.desconto) : undefined,
        store: values.loja || undefined,
        genre: values.genero || undefined,
        sort: values.ordem as SearchSort,
      },
      { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
    ),
    // jogos fora do catálogo vêm da Steam — só na 1ª página e sem filtros (que a Steam não sabe aplicar)
    values.q && page === 1 && !hasFilters
      ? searchSteamGames(values.q).then(
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
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  // links que tiram um filtro (as "etiquetas" de filtros ativos)
  const hrefWithout = (key?: keyof FilterValues, pagina?: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(values)) if (v && k !== key && !(k === "ordem" && v === "relevancia")) qs.set(k, v);
    if (pagina && pagina > 1) qs.set("pagina", String(pagina));
    return qs.size ? `/busca?${qs}` : "/busca";
  };
  const chips: { key: keyof FilterValues; label: string }[] = [];
  if (values.plataforma) chips.push({ key: "plataforma", label: PLATFORM_FAMILIES.find((f) => f.id === values.plataforma)!.label });
  if (values.ate) chips.push({ key: "ate", label: PRICE_CAPS.find((p) => p.value === values.ate)!.label });
  if (values.desconto) chips.push({ key: "desconto", label: `Desconto ${DISCOUNTS.find((d) => d.value === values.desconto)!.label}` });
  if (values.loja) chips.push({ key: "loja", label: getStore(values.loja)?.name ?? values.loja });
  if (values.genero) chips.push({ key: "genero", label: values.genero });

  const title = values.q ? (result.total || fromSteam.length ? `Resultados para “${values.q}”` : `Nada encontrado para “${values.q}”`) : "Explorar jogos";
  const filters = <SearchFilters values={values} genres={result.facets.genres.map((g) => g.value)} stores={Object.keys(STORES)} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SearchForm defaultValue={values.q} size="lg" className="mb-8 max-w-2xl" />
      <PlatformNotice platforms={values.plataforma ? [] : mine} />

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* filtros: lateral no computador, recolhível no celular */}
        <aside className="hidden lg:block">{filters}</aside>
        <details className="rounded-card border border-line bg-surface lg:hidden">
          <summary className="cursor-pointer px-4 py-3 font-display text-sm font-semibold uppercase tracking-wider">
            Filtros e ordem {chips.length > 0 && <span className="text-accent">({chips.length})</span>}
          </summary>
          <div className="border-t border-line px-4 py-4">{filters}</div>
        </details>

        <div className="min-w-0">
          <SectionHeader title={title} aside={`${result.total} ${result.total === 1 ? "jogo" : "jogos"} no catálogo`} />

          {chips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {chips.map((c) => (
                <Link
                  key={c.key}
                  href={hrefWithout(c.key)}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border border-accent-line bg-accent-soft px-2 py-1 text-xs font-medium text-accent hover:bg-accent hover:text-accent-ink"
                  aria-label={`Remover filtro ${c.label}`}
                >
                  {c.label} <span aria-hidden>×</span>
                </Link>
              ))}
            </div>
          )}

          {result.items.length > 0 ? (
            <GameGrid games={result.items.map((d) => toCard(d, platforms))} />
          ) : (
            <p className="rounded-card border border-dashed border-line p-6 text-sm text-text-2">
              {hasFilters ? "Nenhum jogo com esses filtros. Tente remover algum." : "Nenhum jogo do catálogo combina com a busca."}
            </p>
          )}
          <Pagination page={page} totalPages={totalPages} hrefFor={(p) => hrefWithout(undefined, p)} />

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
      </div>
    </div>
  );
}
