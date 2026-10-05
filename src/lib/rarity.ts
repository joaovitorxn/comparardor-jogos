export interface Rarity {
  id: "rare" | "epic" | "legendary" | "mythic";
  label: string;
}

/** Raridade do preço pelo desconto (jargão de loot dos jogos): 30% raro, 50% épico, 70% lendário, 90% mítico. */
export function priceRarity(discountPercent: number): Rarity | null {
  if (discountPercent >= 90) return { id: "mythic", label: "Preço mítico" };
  if (discountPercent >= 70) return { id: "legendary", label: "Preço lendário" };
  if (discountPercent >= 50) return { id: "epic", label: "Preço épico" };
  if (discountPercent >= 30) return { id: "rare", label: "Preço raro" };
  return null;
}
