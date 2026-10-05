import type { StoreId } from "@/lib/stores";
import { gogCollector } from "./gog";
import { nintendoCollector } from "./nintendo";
import { psStoreCollector } from "./psstore";
import { steamCollector } from "./steam";
import type { StoreCollector } from "./types";
import { xboxCollector } from "./xbox";

/** Coletores ativos. Lojas novas entram aqui. */
export const collectors: Partial<Record<StoreId, StoreCollector>> = {
  steam: steamCollector,
  gog: gogCollector,
  // consoles: Xbox e PS Store só atualizam preços (os produtos vêm dos ids do IGDB); a Nintendo também busca por título
  xbox: xboxCollector,
  psstore: psStoreCollector,
  nintendo: nintendoCollector,
};

export function getCollector(store: string): StoreCollector | undefined {
  return collectors[store as StoreId];
}
