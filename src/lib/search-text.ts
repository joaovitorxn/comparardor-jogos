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
  const words = normalizeTitle(title.split(/[:\-–—(]/)[0]).split(" ").filter(Boolean);
  if (!words.length) return [];
  const last = words.at(-1)!;
  const number = /^\d+$/.test(last) ? last : ROMAN[last];
  const base = number ? words.slice(0, -1) : words;
  if (base.length < 2) return [];

  const result = new Set<string>();
  for (const list of [base, base.filter((w) => !SMALL_WORDS.has(w))]) {
    if (list.length < 2) continue;
    const initials = list.map((w) => w[0]).join("");
    result.add(initials);
    if (number) {
      result.add(initials + number);
      if (ROMAN[last]) result.add(initials + last); // gtav
    }
  }
  return [...result];
}
