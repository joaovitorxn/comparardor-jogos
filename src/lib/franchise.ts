/**
 * Franquia de um jogo, deduzida do título (não temos o dado de série). A chave são as duas primeiras
 * palavras do título antes de número, algarismo romano ou subtítulo: "Final Fantasy VII Rebirth" e
 * "Final Fantasy XVI" dão "final fantasy". Duas chaves iguais só contam como a mesma franquia se os jogos
 * também dividem uma desenvolvedora ou distribuidora (assim "Call of Duty" e "Call of Juarez" ficam separados).
 */
const ROMAN = /^(?:ii|iii|iv|vi|vii|viii|ix|x|xi|xii|xiii|xiv|xv|xvi|xvii|xviii|xix|xx)$/;
const ARTICLES = new Set(["the", "a", "an", "o", "os", "as"]);

export function franchiseKey(title: string): string {
  const base = title
    .split(/:| - | – | — /)[0]
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/['’]s\b/g, "s")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const words: string[] = [];
  for (const w of base.split(" ")) {
    if (/^\d+$/.test(w) || ROMAN.test(w)) break;
    if (words.length === 0 && ARTICLES.has(w)) continue;
    words.push(w);
    if (words.length === 2) break;
  }
  return words.join(" ");
}

interface Franchisable {
  title: string;
  developers: string[];
  publishers: string[];
}

const companies = (g: Franchisable) => new Set([...g.developers, ...g.publishers].map((c) => c.toLowerCase()));

export function sameFranchise(a: Franchisable, b: Franchisable): boolean {
  const ka = franchiseKey(a.title);
  if (!ka || ka !== franchiseKey(b.title)) return false;
  const cb = companies(b);
  return [...companies(a)].some((c) => cb.has(c));
}

/**
 * Escolhe até `limit` itens, na ordem recebida, no máximo um por franquia. Se não houver itens suficientes
 * de franquias diferentes, completa com os que ficaram de fora, mantendo a ordem.
 */
export function onePerFranchise<T>(items: T[], limit: number, game: (item: T) => Franchisable): T[] {
  const picked: T[] = [];
  const skipped: T[] = [];
  for (const item of items) {
    if (picked.length >= limit) break;
    (picked.some((p) => sameFranchise(game(p), game(item))) ? skipped : picked).push(item);
  }
  return [...picked, ...skipped.slice(0, limit - picked.length)];
}
