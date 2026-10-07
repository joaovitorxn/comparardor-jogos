import type { PriceSeries } from "@/db/queries";

/** Ponto de uma série em degrau: [timestamp ms, centavos]; cada preço vale até o próximo ponto. */
export type Point = [number, number];

/** Índice do último ponto em ou antes de `t` (o preço vigente — linhas em degrau). */
export function indexAt(points: Point[], t: number): number {
  let lo = 0;
  let hi = points.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid][0] <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

export function valueAt(points: Point[], t: number): number | null {
  const i = indexAt(points, t);
  return i >= 0 ? points[i][1] : null;
}

/**
 * Menor preço entre as lojas em cada instante — a pergunta principal do gráfico.
 * Guarda também qual loja tinha esse preço, para o tooltip.
 */
export function lowerEnvelope(series: PriceSeries[]): { points: Point[]; stores: string[] } {
  const times = [...new Set(series.flatMap((s) => s.points.map((p) => p[0])))].sort((a, b) => a - b);
  const points: Point[] = [];
  const stores: string[] = [];
  for (const t of times) {
    let best: { cents: number; store: string } | null = null;
    for (const s of series) {
      const v = valueAt(s.points, t);
      if (v != null && (!best || v < best.cents)) best = { cents: v, store: s.store };
    }
    if (best && points.at(-1)?.[1] !== best.cents) {
      points.push([t, best.cents]);
      stores.push(best.store);
    }
  }
  return { points, stores };
}

/** Recorta ao período, começando pelo preço vigente no início. */
export function clip(points: Point[], start: number, now: number): Point[] {
  const startValue = valueAt(points, start);
  const inside = points.filter(([t]) => t > start && t <= now);
  return startValue != null ? [[start, startValue], ...inside] : inside;
}
