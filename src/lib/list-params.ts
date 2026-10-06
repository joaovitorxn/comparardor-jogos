import type { IconName } from "@/components/icon";
import { PLATFORM_FAMILIES, STORES } from "./stores";

/**
 * Parâmetros de URL compartilhados pelas telas de Ofertas e Explorar/Busca: a mesma ordenação e os mesmos filtros
 * nas duas, para os links e os botões se comportarem do mesmo jeito.
 */
export interface ListParams {
  q: string;
  plataforma: string;
  ate: string;
  desconto: string;
  loja: string;
  genero: string;
  ordem: SortId;
}

export const PRICE_CAPS = [
  { value: "0", label: "Grátis" },
  { value: "20", label: "Até R$ 20" },
  { value: "50", label: "Até R$ 50" },
  { value: "100", label: "Até R$ 100" },
  { value: "200", label: "Até R$ 200" },
];

export const DISCOUNTS = [
  { value: "25", label: "25% ou mais" },
  { value: "50", label: "50% ou mais" },
  { value: "75", label: "75% ou mais" },
];

export const SORTS = [
  { id: "relevancia", label: "Relevância", icon: "flame", hint: "os que mais valem a pena primeiro" },
  { id: "desconto", label: "Maior desconto", icon: "tag", hint: "do maior desconto para o menor" },
  { id: "preco", label: "Menor preço", icon: "coin", hint: "do mais barato para o mais caro" },
  { id: "nota", label: "Melhor avaliados", icon: "star", hint: "das melhores notas da crítica para as menores" },
  { id: "az", label: "A–Z", icon: "az", hint: "em ordem alfabética" },
] as const satisfies readonly { id: string; label: string; icon: IconName; hint: string }[];

export type SortId = (typeof SORTS)[number]["id"];

/** Nomes antigos da ordenação na busca (links já compartilhados continuam valendo). */
const LEGACY_SORT: Record<string, SortId> = { "menor-preco": "preco", "maior-desconto": "desconto" };

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

/** Lê e valida os parâmetros da URL; o que for inválido vira "sem filtro". */
export function parseListParams(params: Record<string, string | string[] | undefined>): ListParams {
  const ordem = str(params.ordem);
  return {
    q: str(params.q).slice(0, 100),
    plataforma: PLATFORM_FAMILIES.some((f) => f.id === str(params.plataforma)) ? str(params.plataforma) : "",
    ate: PRICE_CAPS.some((p) => p.value === str(params.ate)) ? str(params.ate) : "",
    desconto: DISCOUNTS.some((d) => d.value === str(params.desconto)) ? str(params.desconto) : "",
    loja: str(params.loja) in STORES ? str(params.loja) : "",
    genero: str(params.genero).slice(0, 60),
    ordem: SORTS.find((s) => s.id === ordem)?.id ?? LEGACY_SORT[ordem] ?? "relevancia",
  };
}

export const hasFilters = (p: ListParams) => Boolean(p.plataforma || p.ate || p.desconto || p.loja || p.genero);

/** Endereço da lista com alguns parâmetros trocados (os vazios e a ordenação padrão ficam de fora); mexer nos filtros volta à 1ª página. */
export function listHref(base: string, params: ListParams, changes: Partial<ListParams> = {}, page = 1): string {
  const merged = { ...params, ...changes };
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value && !(key === "ordem" && value === "relevancia")) qs.set(key, value);
  }
  if (page > 1) qs.set("pagina", String(page));
  return qs.size ? `${base}?${qs}` : base;
}
