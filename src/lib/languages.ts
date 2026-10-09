/** Idioma que o jogo suporta na Steam; `audio` = tem dublagem (a Steam marca com asterisco). */
export interface GameLanguage {
  name: string;
  audio: boolean;
}

/**
 * Lê o campo `supported_languages` do appdetails da Steam (pedido com l=brazilian, então os nomes já vêm em português):
 * "Inglês<strong>*</strong>, Francês, Português (Brasil)<br><strong>*</strong>idiomas com suporte total de áudio".
 * Devolve [] quando o jogo não informa idiomas.
 */
export function parseSupportedLanguages(html: string | undefined | null): GameLanguage[] {
  if (!html) return [];
  const list = html.split(/<br\s*\/?>/i)[0];
  return list
    .split(",")
    .map((part) => ({ name: part.replace(/<[^>]*>/g, "").replace(/\*/g, "").trim(), audio: part.includes("*") }))
    .filter((l) => l.name);
}

/** Português do Brasil — o que mais importa para quem usa o site. */
export function brazilianPortuguese(languages: GameLanguage[]): GameLanguage | null {
  return languages.find((l) => /brasil/i.test(l.name)) ?? null;
}

/** Bandeira (código de país do arquivo em public/flags) que representa cada idioma, pelo nome em português da Steam. */
const FLAGS: Record<string, string> = {
  ingles: "gb",
  frances: "fr",
  italiano: "it",
  alemao: "de",
  espanhol: "es",
  grego: "gr",
  japones: "jp",
  coreano: "kr",
  polones: "pl",
  portugues: "pt",
  russo: "ru",
  chines: "cn",
  turco: "tr",
  ucraniano: "ua",
  arabe: "sa",
  tcheco: "cz",
  dinamarques: "dk",
  holandes: "nl",
  finlandes: "fi",
  noruegues: "no",
  sueco: "se",
  hungaro: "hu",
  romeno: "ro",
  tailandes: "th",
  bulgaro: "bg",
  vietnamita: "vn",
  indonesio: "id",
  hebraico: "il",
  hindi: "in",
  croata: "hr",
  eslovaco: "sk",
  lituano: "lt",
  letao: "lv",
  estoniano: "ee",
  esloveno: "si",
  servio: "rs",
  persa: "ir",
  malaio: "my",
  georgiano: "ge",
};

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Código da bandeira do idioma ("Português (Brasil)" → "br"), ou null quando não há uma bandeira óbvia. */
export function flagFor(name: string): string | null {
  const n = plain(name);
  // variantes que têm bandeira própria
  if (n.startsWith("portugues") && n.includes("brasil")) return "br";
  if (n.startsWith("espanhol") && /latin|america/.test(n)) return "mx";
  if (n.startsWith("chines") && n.includes("tradicional")) return "tw";
  const base = n.split(/\s*[(-]/)[0].trim().split(" ")[0];
  return FLAGS[base] ?? null;
}
