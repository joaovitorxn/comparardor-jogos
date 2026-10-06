const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Data exata de lançamento quando o texto traz dia, mês e ano ("5/out./2026"); senão null. */
export function parseReleaseDate(text: string | null | undefined): Date | null {
  const m = text?.match(/^(\d{1,2})\/([a-zç]{3})\.?\/((?:19|20)\d{2})$/i);
  const month = m ? MONTHS.indexOf(m[2].toLowerCase()) : -1;
  return m && month >= 0 ? new Date(Date.UTC(Number(m[3]), month, Number(m[1]), 23, 59, 59)) : null;
}

/** Rótulos de plataforma do IGDB (em games.platforms) → plataforma da oferta da Nintendo. */
const IGDB_LABEL: Record<string, string> = { switch: "Switch", switch2: "Switch 2" };

const YEAR_MS = 365 * 24 * 3600_000;

/**
 * Uma versão de loja pode ser outro jogo com o mesmo título (o "Resident Evil 4" de 2005 e o remake de
 * 2023). Se ela foi lançada mais de um ano ANTES do jogo do catálogo, não é o mesmo jogo: um port nunca
 * chega bem antes do original. Sem as duas datas, não dá para dizer, e a oferta é aceita.
 */
export function releaseMatches(gameRelease: Date | null, offerRelease: Date | null | undefined): boolean {
  if (!gameRelease || !offerRelease) return true;
  return offerRelease.getTime() >= gameRelease.getTime() - YEAR_MS;
}

/**
 * Decide se uma oferta da Nintendo com o MESMO título é de outro jogo (o "Resident Evil 4" de 2005 do Switch x o
 * remake de 2023). Só rejeita quando os dois sinais concordam: o IGDB conhece as plataformas do jogo e não lista
 * aquele Switch, e a oferta é bem anterior ao jogo. Um sinal só não basta (o IGDB às vezes está incompleto e as
 * versões de PC costumam sair anos depois do console).
 */
export function isDifferentGame(
  game: { release: Date | null; platforms: string[] },
  offer: { platform: string; releasedAt?: Date | null },
): boolean {
  const label = IGDB_LABEL[offer.platform];
  if (!label || game.platforms.length === 0) return false;
  return !game.platforms.includes(label) && !releaseMatches(game.release, offer.releasedAt);
}
