import type { Platform } from "@/db/schema";
import type { StoreId } from "@/lib/stores";

export interface OfferPrice {
  currency: string;
  priceCents: number;
  regularPriceCents: number;
  discountPercent: number;
}

export interface StoreOffer {
  store: StoreId;
  storeProductId: string;
  title: string;
  platform: Platform;
  edition?: string;
  drm: string | null;
  isKey: boolean;
  url: string;
  /** null quando a loja não informa preço (pré-lançamento, indisponível na região...). */
  price: OfferPrice | null;
  /** Código exigido para chegar ao preço informado (já descontado em `price`). */
  voucher?: string | null;
  /** Data de lançamento desta versão na loja, quando ela informa (ajuda a não confundir jogos de mesmo título). */
  releasedAt?: Date | null;
}

/**
 * Contrato que todo coletor de loja implementa. Para adicionar uma loja nova,
 * crie um arquivo nesta pasta e registre-o em `collectors/index.ts`.
 */
export interface StoreCollector {
  store: StoreId;
  /** Procura o jogo pelo título — usado para casar um jogo já cadastrado com esta loja. */
  findByTitle(title: string): Promise<StoreOffer[]>;
  /** Busca o preço atual de produtos já conhecidos, indexado pelo id do produto na loja. */
  fetchPrices(productIds: string[]): Promise<Map<string, OfferPrice | null>>;
}
