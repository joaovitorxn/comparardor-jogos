import { Icon } from "./icon";

/**
 * Selo do Steam Deck, segundo a Valve: Verificado ("Aprovado") ou Jogável. Jogos não suportados ou ainda sem análise
 * não mostram nada (não é uma informação útil para decidir a compra).
 */
export function DeckBadge({ status }: { status: number | null }) {
  if (status !== 3 && status !== 2) return null;
  const verified = status === 3;
  return (
    <span
      title={verified ? "Verificado pela Valve: funciona bem no Steam Deck, sem ajustes" : "A Valve diz que roda no Steam Deck, mas pode exigir ajustes"}
      className={`inline-flex items-center gap-1.5 rounded-[3px] border px-1.5 py-px text-[11px] font-semibold leading-4 ${
        verified ? "border-accent-line bg-accent-soft text-accent" : "border-warn-line bg-warn-soft text-warn"
      }`}
    >
      <Icon name="handheld" className="size-3.5" />
      {verified ? "Aprovado no Steam Deck" : "Jogável no Steam Deck"}
    </span>
  );
}
