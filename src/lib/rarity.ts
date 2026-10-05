export interface Rarity {
  id: "rare" | "epic" | "legendary" | "mythic";
  label: string;
}

/** Do mais raro ao mais comum: o desconto mínimo de cada nível (jargão de loot dos jogos). */
export const RARITY_TIERS: (Rarity & { minDiscount: number })[] = [
  { id: "mythic", label: "Preço mítico", minDiscount: 90 },
  { id: "legendary", label: "Preço lendário", minDiscount: 70 },
  { id: "epic", label: "Preço épico", minDiscount: 50 },
  { id: "rare", label: "Preço raro", minDiscount: 30 },
];

/** Raridade do preço pelo desconto: 30% raro, 50% épico, 70% lendário, 90% mítico. */
export function priceRarity(discountPercent: number): Rarity | null {
  const tier = RARITY_TIERS.find((t) => discountPercent >= t.minDiscount);
  return tier ? { id: tier.id, label: tier.label } : null;
}
