import type { Platform } from "@/db/schema";

export type StoreId =
  | "steam"
  | "epic"
  | "gog"
  | "psstore"
  | "msstore"
  | "xbox"
  | "nintendo"
  | "nuuvem"
  | "gmg";

export interface StoreInfo {
  id: StoreId;
  name: string;
  /** Cor usada só no marcador da loja — o resto da UI fica neutro. */
  color: string;
  platforms: Platform[];
  homepage: string;
  /** "active" = já temos coletor funcionando. */
  status: "active" | "planned";
}

export const STORES: Record<StoreId, StoreInfo> = {
  steam: { id: "steam", name: "Steam", color: "#66c0f4", platforms: ["pc"], homepage: "https://store.steampowered.com", status: "active" },
  gog: { id: "gog", name: "GOG", color: "#b46ee6", platforms: ["pc"], homepage: "https://www.gog.com", status: "active" },
  epic: { id: "epic", name: "Epic Games", color: "#e6e6e6", platforms: ["pc"], homepage: "https://store.epicgames.com", status: "active" },
  nuuvem: { id: "nuuvem", name: "Nuuvem", color: "#ff7a00", platforms: ["pc"], homepage: "https://www.nuuvem.com", status: "active" },
  gmg: { id: "gmg", name: "Green Man Gaming", color: "#2ecc71", platforms: ["pc"], homepage: "https://www.greenmangaming.com", status: "active" },
  // Microsoft Store (versão PC, via ITAD) e Xbox (console, coletor direto) são lojas separadas aqui:
  // um jogo Xbox Play Anywhere aparece só como Xbox, e a compra vale também para o PC
  msstore: { id: "msstore", name: "Microsoft Store", color: "#00a4ef", platforms: ["pc"], homepage: "https://apps.microsoft.com", status: "active" },
  xbox: { id: "xbox", name: "Xbox", color: "#107c10", platforms: ["xbox"], homepage: "https://www.xbox.com/pt-BR/games/store", status: "active" },
  psstore: { id: "psstore", name: "PlayStation Store", color: "#0070d1", platforms: ["ps5", "ps4"], homepage: "https://store.playstation.com/pt-br", status: "active" },
  nintendo: { id: "nintendo", name: "Nintendo eShop", color: "#e60012", platforms: ["switch", "switch2"], homepage: "https://www.nintendo.com/pt-br/store", status: "active" },
};

export function getStore(id: string): StoreInfo | undefined {
  return STORES[id as StoreId];
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  pc: "PC",
  ps5: "PS5",
  ps4: "PS4",
  xbox: "Xbox",
  switch: "Switch",
  switch2: "Switch 2",
};

/** Agrupa plataformas como as pessoas pensam nelas ("tenho um PlayStation"). */
export const PLATFORM_FAMILIES = [
  { id: "pc", label: "PC", platforms: ["pc"] },
  { id: "playstation", label: "PlayStation", platforms: ["ps5", "ps4"] },
  { id: "xbox", label: "Xbox", platforms: ["xbox"] },
  { id: "nintendo", label: "Switch", platforms: ["switch", "switch2"] },
] as const satisfies readonly { id: string; label: string; platforms: readonly Platform[] }[];

export type PlatformFamilyId = (typeof PLATFORM_FAMILIES)[number]["id"];

export function platformFamily(platform: Platform): PlatformFamilyId {
  return PLATFORM_FAMILIES.find((f) => (f.platforms as readonly Platform[]).includes(platform))!.id;
}

export const PLAY_ANYWHERE = "Play Anywhere";

/** Famílias em que a oferta serve: um jogo Xbox Play Anywhere também vale para quem joga no PC. */
export function offerFamilies(listing: { platform: Platform; edition: string }): PlatformFamilyId[] {
  const family = platformFamily(listing.platform);
  return listing.edition === PLAY_ANYWHERE && family !== "pc" ? [family, "pc"] : [family];
}

export const DRM_LABELS: Record<string, string> = {
  steam: "Ativa na Steam",
  gog: "Sem DRM",
  epic: "Ativa na Epic",
  microsoft: "Ativa na Microsoft",
  console: "Console",
};
