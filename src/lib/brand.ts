/** Marca do site — usado no cabeçalho, metadados, manifest e ícones. */
export const BRAND = {
  name: "Dropou",
  tagline: "o menor preço de cada jogo",
  domain: "dropou.com.br",
} as const;

/**
 * Símbolo (grade 28×28): a seta do preço caindo e o "drop" de loot embaixo dela.
 * Os mesmos traços no cabeçalho (SVG) e nos ícones gerados (favicon, app, notificações).
 */
export const LOGO = {
  viewBox: "0 0 28 28",
  arrow: "M14 4.5V15M8.5 10l5.5 5.5 5.5-5.5",
  loot: "M14 18.25l3.25 3.25L14 24.75l-3.25-3.25z",
  strokeWidth: 2.8,
} as const;
