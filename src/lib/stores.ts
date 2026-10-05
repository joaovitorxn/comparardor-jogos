import type { Platform } from "@/db/schema";

export type StoreId =
  | "steam"
  | "epic"
  | "gog"
  | "psstore"
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
  // por enquanto só a versão PC (Microsoft Store, via ITAD); consoles Xbox entram com coletor próprio
  xbox: { id: "xbox", name: "Microsoft Store", color: "#107c10", platforms: ["xbox", "pc"], homepage: "https://www.xbox.com/pt-BR/games/store", status: "active" },
  psstore: { id: "psstore", name: "PlayStation Store", color: "#0070d1", platforms: ["ps5", "ps4"], homepage: "https://store.playstation.com/pt-br", status: "planned" },
  nintendo: { id: "nintendo", name: "Nintendo eShop", color: "#e60012", platforms: ["switch"], homepage: "https://www.nintendo.com/pt-br/store", status: "planned" },
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
};

export const DRM_LABELS: Record<string, string> = {
  steam: "Ativa na Steam",
  gog: "Sem DRM",
  epic: "Ativa na Epic",
  microsoft: "Ativa na Microsoft",
  console: "Console",
};
