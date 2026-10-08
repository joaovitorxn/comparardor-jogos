/** Sinais usados para escolher os "principais" lançamentos. */
export interface LaunchSignals {
  /** Maior preço original (sem desconto) entre as ofertas, em centavos: jogo grande custa mais. */
  maxRegularCents: number;
  /** Quantas famílias de plataforma (PC, PlayStation, Xbox, Nintendo) vendem o jogo. */
  families: number;
  /** Em quantas lojas ele está à venda. */
  stores: number;
  /** Qualidade 0–100 (crítica e jogadores; 55 = sem nota ainda). */
  quality: number;
  /** Avaliações de jogadores na Steam: sinal de popularidade, o único que existe já nos primeiros dias. */
  reviews?: number;
  /** Dias desde o lançamento (0 = hoje). */
  daysSinceRelease?: number;
}

/**
 * Pontuação para escolher os "principais" lançamentos sem ter dados de popularidade. Jogo grande tende a ter preço cheio
 * alto (até 50 pontos, a partir de R$ 250), sair em várias plataformas (até 24) e a crítica, quando já existe, ajuda
 * (até 36). O número de lojas pesa pouco (até 12), porque o mesmo jogo de PC aparece em várias lojas de chave.
 * A popularidade vem do ritmo de avaliações dos jogadores (avaliações por dia desde o lançamento, até 30 pontos), e a
 * novidade conta bastante (até 40 pontos nos 3 primeiros dias, caindo até zero em 30 dias): "acabou de sair" precisa mostrar
 * o que saiu agora, mesmo antes de ter crítica e avaliações.
 */
export function launchScore({ maxRegularCents, families, stores, quality, reviews = 0, daysSinceRelease = 30 }: LaunchSignals): number {
  const price = (Math.min(Math.max(maxRegularCents, 0), 25_000) / 25_000) * 50;
  const breadth = Math.min(families, 4) * 6;
  const reach = Math.min(stores, 6) * 2;
  const critic = Math.max(0, quality - 55) * 0.8;
  const perDay = Math.max(reviews, 0) / Math.max(daysSinceRelease, 3);
  const popularity = (Math.min(Math.log10(perDay + 1), 3) / 3) * 30;
  const freshness = (Math.min(Math.max(30 - Math.max(daysSinceRelease, 3), 0) / 27, 1)) * 40;
  return price + breadth + reach + critic + popularity + freshness;
}
