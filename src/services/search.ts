import MiniSearch from "minisearch";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { getBestPricesByFamily } from "@/db/queries";
import { games, listings } from "@/db/schema";
import type { BestPrice, FamilyKey } from "@/lib/best-by-family";
import { searchTerm, titleAcronyms } from "@/lib/search-text";
import { compareOffers, type PlatformFamilyId } from "@/lib/stores";
import { normalizeTitle } from "@/lib/text";

/**
 * Busca do site: um índice MiniSearch em memória com o catálogo inteiro (alguns milhares de
 * jogos cabem com folga). Tolera erros de digitação, completa a última palavra enquanto a
 * pessoa digita e entende siglas ("gta", "rdr2") e algarismos romanos ("hades 2").
 */

export interface SearchDoc {
  id: number;
  slug: string;
  title: string;
  coverUrl: string | null;
  developers: string[];
  genres: string[];
  acronyms: string[];
  stores: string[];
  /** Menor preço atual por plataforma ("all" = qualquer uma). */
  prices: Partial<Record<FamilyKey, BestPrice>>;
  rating: number | null;
  /** Menor preço já registrado (centavos), para a etiqueta "Preço histórico". */
  historyLowCents: number | null;
  createdAt: number;
}

export type SearchSort = "relevancia" | "menor-preco" | "maior-desconto" | "nota" | "az";

export interface SearchFilters {
  q?: string;
  /** Plataformas escolhidas (vazio = todas): só jogos à venda nelas, com o preço vindo delas. */
  platforms?: PlatformFamilyId[];
  minCents?: number;
  maxCents?: number;
  minDiscount?: number;
  store?: string;
  genre?: string;
  sort?: SearchSort;
}

export interface Facet {
  value: string;
  count: number;
}

// o índice só precisa refletir os preços da última coleta (de hora em hora); montá-lo custa uma leitura grande do banco
const TTL_MS = 15 * 60_000;
interface IndexState {
  index: MiniSearch<SearchDoc>;
  docs: Map<number, SearchDoc>;
  builtAt: number;
}

let state: IndexState | null = null;
let building: Promise<IndexState> | null = null;

async function build(): Promise<IndexState> {
  const [rows, storeRows] = await Promise.all([
    db
      .select({
        id: games.id,
        slug: games.slug,
        title: games.title,
        coverUrl: games.coverUrl,
        developers: games.developers,
        genres: games.genres,
        criticRating: games.criticRating,
        metacritic: games.metacritic,
        historyLowCents: games.historyLowCents,
        createdAt: games.createdAt,
      })
      .from(games),
    db
      .selectDistinct({ gameId: listings.gameId, store: listings.store })
      .from(listings)
      .where(and(eq(listings.available, true), isNotNull(listings.lastCheckedAt))),
  ]);
  const best = await getBestPricesByFamily(rows.map((r) => r.id));
  const storesByGame = Map.groupBy(storeRows, (r) => r.gameId);

  const docs = new Map<number, SearchDoc>();
  for (const r of rows) {
    docs.set(r.id, {
      id: r.id,
      slug: r.slug,
      title: r.title,
      coverUrl: r.coverUrl,
      developers: r.developers,
      genres: r.genres,
      acronyms: titleAcronyms(r.title),
      stores: [...new Set((storesByGame.get(r.id) ?? []).map((s) => s.store))],
      prices: Object.fromEntries(best.get(r.id) ?? []),
      rating: r.criticRating ?? r.metacritic ?? null,
      historyLowCents: r.historyLowCents,
      createdAt: r.createdAt.getTime(),
    });
  }

  const index = new MiniSearch<SearchDoc>({
    fields: ["title", "acronyms", "developers", "genres"],
    storeFields: [],
    extractField: (doc, field) => {
      // o MiniSearch também lê o id por aqui: precisa continuar número
      if (field === "id") return doc.id as unknown as string;
      const value = doc[field as keyof SearchDoc];
      return Array.isArray(value) ? value.join(" ") : String(value ?? "");
    },
    processTerm: searchTerm,
    searchOptions: {
      boost: { title: 3, acronyms: 2.5, developers: 1, genres: 0.3 },
      // termos curtos (siglas, números) precisam bater exatos; os longos aceitam ~1 erro a cada 4 letras
      fuzzy: (term) => (term.length > 3 ? 0.25 : 0),
      // completa só a última palavra (a que a pessoa ainda está digitando)
      prefix: (_term, i, terms) => i === terms.length - 1,
      combineWith: "AND",
    },
  });
  index.addAll([...docs.values()]);
  return { index, docs, builtAt: Date.now() };
}

/** Índice atual; quando passa do prazo, devolve o antigo e reconstrói em segundo plano. */
async function getState(): Promise<IndexState> {
  if (state && Date.now() - state.builtAt < TTL_MS) return state;
  if (!building) {
    building = build()
      .then((s) => (state = s))
      .finally(() => (building = null));
  }
  return state ?? building;
}

/** Busca textual: ids ordenados por relevância, com o título exato sempre primeiro. */
function textSearch(index: MiniSearch<SearchDoc>, docs: Map<number, SearchDoc>, q: string): SearchDoc[] {
  const target = normalizeTitle(q);
  return index
    .search(q)
    .map((r) => docs.get(r.id as number)!)
    .filter(Boolean)
    .sort((a, b) => Number(normalizeTitle(b.title) === target) - Number(normalizeTitle(a.title) === target));
}

/** Melhor preço do jogo entre as plataformas escolhidas (sem escolha, entre todas). */
export function bestPriceFor(doc: SearchDoc, platforms: PlatformFamilyId[] = []): BestPrice | undefined {
  if (!platforms.length) return doc.prices.all;
  return platforms
    .flatMap((f) => (doc.prices[f] ? [doc.prices[f]!] : []))
    .sort((a, b) => compareOffers(a, b))[0];
}

export async function searchCatalog(filters: SearchFilters, { limit = 30, offset = 0 } = {}) {
  const { index, docs } = await getState();
  const q = filters.q?.trim() ?? "";
  let results = q ? textSearch(index, docs, q) : [...docs.values()];

  results = results.filter((doc) => {
    const price = bestPriceFor(doc, filters.platforms);
    if (filters.platforms?.length && !price) return false;
    if (filters.store && !doc.stores.includes(filters.store)) return false;
    if (filters.genre && !doc.genres.includes(filters.genre)) return false;
    if (filters.minCents != null && (!price || price.cents < filters.minCents)) return false;
    if (filters.maxCents != null && (!price || price.cents > filters.maxCents)) return false;
    if (filters.minDiscount != null && (!price || price.discountPercent < filters.minDiscount)) return false;
    return true;
  });

  const sort = filters.sort ?? "relevancia";
  const cents = (d: SearchDoc) => bestPriceFor(d, filters.platforms)?.cents ?? Infinity;
  const comparators: Record<SearchSort, ((a: SearchDoc, b: SearchDoc) => number) | null> = {
    // com texto, a ordem do índice já é a relevância; sem texto, jogos em mais lojas (mais populares) primeiro
    relevancia: q ? null : (a, b) => b.stores.length - a.stores.length || (b.rating ?? 0) - (a.rating ?? 0),
    "menor-preco": (a, b) => cents(a) - cents(b),
    "maior-desconto": (a, b) => (bestPriceFor(b, filters.platforms)?.discountPercent ?? 0) - (bestPriceFor(a, filters.platforms)?.discountPercent ?? 0),
    nota: (a, b) => (b.rating ?? -1) - (a.rating ?? -1),
    az: (a, b) => a.title.localeCompare(b.title, "pt-BR"),
  };
  const compare = comparators[sort];
  if (compare) results = [...results].sort(compare);

  const count = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
    return [...counts].map(([value, n]) => ({ value, count: n })).sort((a, b) => b.count - a.count);
  };

  return {
    items: results.slice(offset, offset + limit),
    total: results.length,
    facets: {
      genres: count(results.flatMap((d) => d.genres)).slice(0, 14),
      stores: count(results.flatMap((d) => d.stores)),
    },
  };
}

export interface Suggestion {
  slug: string;
  title: string;
  coverUrl: string | null;
  price: BestPrice | null;
}

/** Até `limit` jogos para o autocompletar da barra de busca. */
export async function suggest(q: string, { limit = 3, platforms }: { limit?: number; platforms?: PlatformFamilyId[] } = {}): Promise<Suggestion[]> {
  if (q.trim().length < 2) return [];
  const { index, docs } = await getState();
  return textSearch(index, docs, q)
    .slice(0, limit)
    .map((d) => ({ slug: d.slug, title: d.title, coverUrl: d.coverUrl, price: bestPriceFor(d, platforms) ?? d.prices.all ?? null }));
}
