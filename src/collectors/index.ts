import type { StoreId } from "@/lib/stores";
import { gogCollector } from "./gog";
import { steamCollector } from "./steam";
import type { StoreCollector } from "./types";

/** Coletores ativos. Lojas novas entram aqui. */
export const collectors: Partial<Record<StoreId, StoreCollector>> = {
  steam: steamCollector,
  gog: gogCollector,
};

export function getCollector(store: string): StoreCollector | undefined {
  return collectors[store as StoreId];
}
