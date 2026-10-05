import type { PcRequirements, RequirementItem } from "@/db/schema";
import { decodeHtmlEntities } from "./text";

const stripTags = (html: string) => decodeHtmlEntities(html.replace(/<[^>]*>/g, " "));

/**
 * Converte o HTML de requisitos da Steam em pares rótulo/valor — assim nunca
 * renderizamos HTML de terceiros na página.
 * Formato típico: `<strong>Mínimos:</strong><br><ul><li><strong>SO:</strong> Windows 10<br></li>...</ul>`
 */
export function parseSteamRequirements(html: string | undefined): RequirementItem[] {
  if (!html) return [];
  // sem <li>, alguns jogos usam só quebras de linha
  const chunks = /<li[\s>]/i.test(html)
    ? [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1])
    : html.split(/<br\s*\/?>/i);

  const items: RequirementItem[] = [];
  for (const chunk of chunks) {
    const labelled = chunk.match(/^\s*<strong>([\s\S]*?)<\/strong>([\s\S]*)$/i);
    if (labelled) {
      const label = stripTags(labelled[1]).replace(/:$/, "").trim();
      const value = stripTags(labelled[2]).replace(/^:\s*/, "");
      // o título da seção ("Mínimos:") vem sem valor — descartamos
      if (value) items.push({ label: label || null, value });
    } else {
      const value = stripTags(chunk);
      if (value) items.push({ label: null, value });
    }
  }
  return items;
}

export function parsePcRequirements(raw: { minimum?: string; recommended?: string } | unknown[] | undefined): PcRequirements | null {
  if (!raw || Array.isArray(raw)) return null;
  const result = { minimum: parseSteamRequirements(raw.minimum), recommended: parseSteamRequirements(raw.recommended) };
  return result.minimum.length || result.recommended.length ? result : null;
}
