import { normalizeTitle } from "./text";

// algarismos romanos usados em títulos de jogos ("Hades II", "Final Fantasy VII")
const ROMAN: Record<string, string> = { ii: "2", iii: "3", iv: "4", v: "5", vi: "6", vii: "7", viii: "8", ix: "9", x: "10", xi: "11", xii: "12" };

/**
 * Normaliza um termo para a busca: minúsculas, sem acentos e pontuação, e romanos viram
 * números — assim "hades 2" encontra "Hades II". Usado igual no índice e na consulta.
 */
export function searchTerm(term: string): string | null {
  const t = normalizeTitle(term);
  if (!t) return null;
  return ROMAN[t] ?? t;
}

/** Palavras curtas que geram uma segunda sigla sem elas ("The Legend of Zelda" → "tloz" e "lz"). */
const SMALL_WORDS = new Set(["the", "of", "a", "an", "and", "o", "de", "do", "da", "e"]);

/**
 * Siglas que jogadores usam para buscar: "Grand Theft Auto V" → gta, gtav, gta5;
 * "Red Dead Redemption 2" → rdr, rdr2; "Baldur's Gate 3" → bg, bg3.
 * Só para títulos de 2+ palavras (antes do número).
 */
export function titleAcronyms(title: string): string[] {
  // corta subtítulos ("Título: Sub", "Título - Sub", "Título (2020)"), mas não hífens dentro do nome ("Counter-Strike")
  const main = title.split(/:|\s[-–—]\s|\(/)[0];
  const words = normalizeTitle(main).split(" ").filter(Boolean);
  if (!words.length) return [];
  // o número nem sempre é a última palavra: "Grand Theft Auto V Enhanced"
  const isNumber = (w: string) => /^\d+$/.test(w) || w in ROMAN;
  const numberAt = words.findLastIndex((w, i) => i > 0 && isNumber(w));
  const numberWord = numberAt >= 0 ? words[numberAt] : null;
  const number = numberWord ? (ROMAN[numberWord] ?? numberWord) : null;
  const base = numberAt >= 0 ? words.slice(0, numberAt) : words;
  if (base.length < 2) return [];

  const result = new Set<string>();
  for (const list of [base, base.filter((w) => !SMALL_WORDS.has(w))]) {
    if (list.length < 2) continue;
    const initials = list.map((w) => w[0]).join("");
    result.add(initials);
    if (number) {
      result.add(initials + number);
      if (numberWord !== number) result.add(initials + numberWord); // gtav
    }
  }
  return [...result];
}
