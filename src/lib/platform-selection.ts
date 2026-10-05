import { PLATFORM_FAMILIES, type PlatformFamilyId } from "./stores";

/**
 * "Minhas plataformas": o que a pessoa joga (PC, PlayStation, Xbox, Nintendo). Fica num cookie para o
 * servidor poder filtrar as páginas; sem nada marcado (ou com tudo marcado) o site mostra tudo.
 */
export const PLATFORMS_COOKIE = "dropou_plataformas";

const ORDER = PLATFORM_FAMILIES.map((f) => f.id);
const VALID = new Set<string>(ORDER);

/** Lista válida, sem repetição e na ordem de sempre; vazia quando é "tudo" (nada ou todas marcadas). */
export function parsePlatforms(value: string | null | undefined): PlatformFamilyId[] {
  const picked = new Set((value ?? "").split(/[.\-,]/).filter((v) => VALID.has(v)));
  if (picked.size === 0 || picked.size === ORDER.length) return [];
  return ORDER.filter((id) => picked.has(id));
}

/** Texto curto para cookie e para a rota da home personalizada ("playstation-pc" → ordem fixa). */
export function serializePlatforms(platforms: PlatformFamilyId[]): string {
  return parsePlatforms(platforms.join(".")).join("-");
}

/** Combinações possíveis (15 menos "nenhuma" e "todas"): as páginas personalizadas são geradas para elas. */
export function allPlatformCombinations(): PlatformFamilyId[][] {
  const result: PlatformFamilyId[][] = [];
  for (let mask = 1; mask < 2 ** ORDER.length - 1; mask++) result.push(ORDER.filter((_, i) => mask & (1 << i)));
  return result;
}
