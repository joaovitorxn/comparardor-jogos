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
}

/**
 * Pontuação para escolher os "principais" lançamentos sem ter dados de popularidade. Jogo grande tende a ter preço cheio
 * alto (até 50 pontos, a partir de R$ 250), sair em várias plataformas (até 24) e a crítica, quando já existe, ajuda
 * (até 36), e a quantidade de avaliações dos jogadores mostra se o jogo está sendo jogado (até 30). O número de lojas pesa pouco (até 12), porque o mesmo jogo de PC aparece em várias lojas de chave.
 * Lançamento pequeno, de uma loja só e sem nota, fica lá embaixo.
 */
export function launchScore({ maxRegularCents, families, stores, quality, reviews = 0 }: LaunchSignals): number {
  const price = (Math.min(Math.max(maxRegularCents, 0), 25_000) / 25_000) * 50;
  const breadth = Math.min(families, 4) * 6;
  const reach = Math.min(stores, 6) * 2;
  const critic = Math.max(0, quality - 55) * 0.8;
  // 10 avaliações já contam um pouco; 10 mil ou mais valem o máximo
  const popularity = (Math.min(Math.log10(Math.max(reviews, 0) + 1), 4) / 4) * 30;
  return price + breadth + reach + critic + popularity;
}
