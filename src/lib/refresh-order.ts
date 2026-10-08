/** Fatia de cada rodada reservada às ofertas com desconto: são as que podem acabar (e as que aparecem em destaque). */
export const DISCOUNT_SHARE = 0.7;

/**
 * Escolhe quais ofertas verificar nesta rodada (`rows` já vem da mais antiga para a mais nova): até 70% do limite vai
 * para as que estão em promoção, porque uma promoção que acabou continua aparecendo até a próxima verificação; o resto
 * fica com as mais antigas de todas, para nenhuma oferta (nova ou sem desconto) ficar sem ser olhada.
 */
export function pickForRefresh<T extends { discount: number | null }>(rows: T[], cap: number): T[] {
  if (rows.length <= cap) return rows;
  const picked = new Set(rows.filter((r) => (r.discount ?? 0) > 0).slice(0, Math.ceil(cap * DISCOUNT_SHARE)));
  for (const r of rows) {
    if (picked.size >= cap) break;
    picked.add(r);
  }
  return rows.filter((r) => picked.has(r));
}

/** O preço lido na loja é igual ao que já está gravado na oferta? (então basta marcar a oferta como verificada) */
export function isSamePrice(
  current: { priceCents: number | null; priceRegularCents: number | null; priceCurrency: string | null },
  price: { priceCents: number; regularPriceCents: number; currency: string },
): boolean {
  return current.priceCents === price.priceCents && current.priceRegularCents === price.regularPriceCents && current.priceCurrency === price.currency;
}
