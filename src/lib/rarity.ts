export interface Rarity {
  id: "rare" | "epic" | "legendary" | "mythic";
  label: string;
}

/** Do mais raro ao mais comum: o desconto mínimo de cada nível (jargão de loot dos jogos). */
export const RARITY_TIERS: (Rarity & { minDiscount: number })[] = [
  { id: "mythic", label: "Desconto mítico", minDiscount: 90 },
  { id: "legendary", label: "Desconto lendário", minDiscount: 70 },
  { id: "epic", label: "Desconto épico", minDiscount: 50 },
  { id: "rare", label: "Desconto raro", minDiscount: 30 },
];

/** Raridade do desconto: 30% raro, 50% épico, 70% lendário, 90% mítico. */
export function priceRarity(discountPercent: number): Rarity | null {
  const tier = RARITY_TIERS.find((t) => discountPercent >= t.minDiscount);
  return tier ? { id: tier.id, label: tier.label } : null;
}
