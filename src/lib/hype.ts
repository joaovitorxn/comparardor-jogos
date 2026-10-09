/** Só votos recentes contam: o hype de uma promoção antiga não vale para a de agora. */
export const HYPE_WINDOW_DAYS = 30;
/** Abaixo disso o contador não aparece (um "1" sozinho passa a ideia errada). */
export const HYPE_MIN_SHOWN = 5;
/** Jogos já hypados neste navegador, e o identificador aleatório de quem vota. */
export const HYPE_COOKIE = "hypar";
export const HYPE_VOTER_COOKIE = "hypar-id";

const MAX_STORED = 200;

/**
 * Pontos somados à pontuação de destaque. Cresce com o logaritmo dos votos e para em 12 (a pontuação vai de 0 a ~110),
 * então é preciso muita gente para mudar um jogo de posição, e votos extras depois do teto não rendem nada.
 */
export function hypeBonus(votes: number): number {
  if (!Number.isFinite(votes) || votes <= 0) return 0;
  return Math.min(12, 6 * Math.log10(1 + votes));
}

/** Lê o cookie dos jogos já hypados ("12.7.30"); ignora o que não for id válido. */
export function parseHyped(raw: string | undefined | null): number[] {
  if (!raw) return [];
  return raw
    .split(".")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(-MAX_STORED);
}

export function serializeHyped(ids: number[]): string {
  return ids.slice(-MAX_STORED).join(".");
}
