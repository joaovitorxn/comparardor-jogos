/**
 * Normaliza títulos para comparar o mesmo jogo entre lojas.
 * "The Witcher® 3: Wild Hunt" e "The Witcher 3 - Wild Hunt" viram "the witcher 3 wild hunt".
 */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[™®©'’]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Decodifica entidades HTML (&quot;, &#39;, &#x27;...) e normaliza espaços. */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => {
      if (e[0] !== "#") return ENTITIES[e.toLowerCase()] ?? m;
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(title: string): string {
  return normalizeTitle(title).replace(/\s/g, "-");
}
