// Opções dos filtros da busca. Ficam fora do componente (que é "use client") para a página,
// renderizada no servidor, também poder usá-las na validação dos parâmetros da URL.

export interface FilterValues {
  q: string;
  plataforma: string;
  ate: string;
  desconto: string;
  loja: string;
  genero: string;
  ordem: string;
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
  { value: "relevancia", label: "Relevância" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-desconto", label: "Maior desconto" },
  { value: "nota", label: "Melhor avaliados" },
  { value: "az", label: "A–Z" },
];
