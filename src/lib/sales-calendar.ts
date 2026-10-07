/**
 * Grandes promoções do ano, para o "Vale esperar?" dizer quanto falta para a próxima.
 * Atualizado à mão; `approx` marca as datas que as lojas ainda não confirmam (o texto avisa "por volta de").
 */
export interface SaleEvent {
  name: string;
  date: string;
  approx?: boolean;
  /** Só vale para jogos vendidos na Steam. */
  steamOnly?: boolean;
}

export const SALE_EVENTS: SaleEvent[] = [
  { name: "Black Friday", date: "2026-11-27" },
  { name: "Promoção de inverno da Steam", date: "2026-12-17", approx: true, steamOnly: true },
  { name: "Promoção de verão da Steam", date: "2027-06-25", approx: true, steamOnly: true },
  { name: "Black Friday", date: "2027-11-26", approx: true },
];

const DAY = 86_400_000;

/** Próxima grande promoção dentro de `withinDays` dias. */
export function nextSale(now: number, hasSteam: boolean, withinDays = 100): { name: string; days: number; approx: boolean } | null {
  for (const e of SALE_EVENTS) {
    if (e.steamOnly && !hasSteam) continue;
    const days = Math.ceil((Date.parse(`${e.date}T00:00:00-03:00`) - now) / DAY);
    if (days >= 0 && days <= withinDays) return { name: e.name, days, approx: !!e.approx };
    if (days > withinDays) return null;
  }
  return null;
}
