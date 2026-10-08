/** Dados de avaliação de um jogo (todos podem faltar). */
export interface RatingData {
  criticRating: number | null;
  criticRatingCount: number | null;
  metacritic: number | null;
  /** % de avaliações positivas dos jogadores na Steam e quantas avaliações. */
  userScore: number | null;
  userReviewCount: number | null;
}

/** Percentual positivo dos jogadores na escala de nota da crítica: 50% ≈ 35, 70% ≈ 60, 85% ≈ 80, 95% ≈ 92. */
export function userScoreAsRating(percent: number): number {
  return Math.min(100, Math.max(0, 35 + (percent - 50) * 1.27));
}

/**
 * Qualidade do jogo (0–100) juntando a crítica e os jogadores. Cada fonte vale pela confiança que merece: a crítica pela
 * quantidade de análises (5 ou mais pesa tudo; o Metacritic sozinho conta como 5) e os jogadores pela de avaliações
 * (200 ou mais pesa tudo; menos de 10 não conta). Os jogadores pesam um pouco mais, porque costumam dizer mais sobre se o
 * jogo é bom de jogar. Sem nenhuma nota, fica em 55; com pouca confiança, a nota é puxada para 60.
 */
export function blendedQuality(g: RatingData): number {
  const criticValue = g.criticRating ?? g.metacritic;
  const criticTrust = criticValue != null ? 0.8 * Math.min(1, (g.criticRatingCount ?? (g.metacritic ? 5 : 0)) / 5) : 0;
  const hasUsers = g.userScore != null && (g.userReviewCount ?? 0) >= 10;
  const userTrust = hasUsers ? Math.min(1, (g.userReviewCount ?? 0) / 200) : 0;
  const total = criticTrust + userTrust;
  if (total === 0) return 55;
  const value = ((criticValue ?? 0) * criticTrust + (hasUsers ? userScoreAsRating(g.userScore!) : 0) * userTrust) / total;
  return 60 + (value - 60) * Math.min(1, total);
}
