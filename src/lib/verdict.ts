import type { PriceSeries } from "@/db/queries";
import { clip, lowerEnvelope, type Point } from "./price-series";
import { nextSale } from "./sales-calendar";

const DAY = 86_400_000;
const YEAR = 365 * DAY;
/** Histórico mínimo para opinar: menos que isso e o "menor preço" ainda não quer dizer nada. */
const MIN_SPAN = 90 * DAY;
/** "Perto do menor preço": até 10% acima. */
const NEAR_LOW = 1.1;
/** "Esperar vale": o preço de hoje está pelo menos 25% acima do menor do ano. */
const WAIT_ABOVE = 1.25;
/** Diferença mínima (R$ 5,00) para valer esperar: em jogo barato, esperar não compensa. */
const MIN_SAVING = 500;
/** Uma ocasião conta como "chegou perto" quando ficou até 15% acima do menor do ano. */
const EPISODE_BAND = 1.15;

export interface Verdict {
  kind: "buy" | "wait" | "neutral";
  title: string;
  currentCents: number;
  /** Menor e média (ponderada pelo tempo) dos últimos 12 meses. */
  lowCents: number;
  avgCents: number;
  /** Quantas vezes, nos últimos 12 meses, o preço ficou perto do menor (a ocasião atual conta). */
  nearLowCount: number;
  /** Há quantos dias o preço de hoje está valendo; null quando a loja mais barata mudou há pouco. */
  daysAtCurrent: number | null;
  atHistoricLow: boolean;
  /** Próxima grande promoção (só para quem pode esperar). */
  sale: { name: string; days: number; approx: boolean } | null;
}

/**
 * Estima se vale comprar agora ou esperar, pelo histórico de menor preço entre as lojas.
 * Devolve null quando não há o que dizer: histórico curto, jogo grátis, ou preço que nunca mudou.
 */
export function computeVerdict(input: {
  series: PriceSeries[];
  currentCents: number;
  historicLowCents: number | null;
  now: number;
  hasSteam: boolean;
}): Verdict | null {
  const { currentCents, historicLowCents, now } = input;
  if (currentCents <= 0) return null;

  // brinde (R$ 0 numa promoção) não é preço
  const series = input.series.map((s) => ({ ...s, points: s.points.filter(([, c]) => c > 0) }));
  const envelope = lowerEnvelope(series).points;
  if (!envelope.length || now - envelope[0][0] < MIN_SPAN) return null;

  const points: Point[] = clip(envelope, now - YEAR, now);
  if (!points.length) return null;

  // cada ponto vale até o próximo
  let low = Infinity;
  let high = 0;
  let weighted = 0;
  let total = 0;
  let nearLowRuns = 0;
  const segments = points.map(([t, cents], i) => ({ cents, ms: (points[i + 1]?.[0] ?? now) - t }));
  for (const s of segments) {
    low = Math.min(low, s.cents);
    high = Math.max(high, s.cents);
    weighted += s.cents * s.ms;
    total += s.ms;
  }
  low = Math.min(low, currentCents);
  if (high < low * 1.15 || total <= 0) return null; // preço que quase nunca mexe: nada a comparar

  let inRun = false;
  for (const s of segments) {
    const near = s.cents <= low * EPISODE_BAND;
    if (near && !inRun) nearLowRuns++;
    inRun = near;
  }
  if (currentCents <= low * EPISODE_BAND && !inRun) nearLowRuns++;

  const last = points.at(-1)!;
  const daysAtCurrent = last[1] === currentCents ? Math.floor((now - last[0]) / DAY) : null;
  const atHistoricLow = historicLowCents != null && currentCents <= historicLowCents;
  const ratio = currentCents / low;

  let kind: Verdict["kind"];
  let title: string;
  if (ratio <= NEAR_LOW) {
    kind = "buy";
    title = atHistoricLow ? "Menor preço já registrado" : ratio <= 1 ? "Menor preço dos últimos 12 meses" : "Perto do menor preço do ano";
  } else if (ratio >= WAIT_ABOVE && nearLowRuns >= 2 && currentCents - low >= MIN_SAVING) {
    kind = "wait";
    title = "Costuma ficar mais barato";
  } else {
    kind = "neutral";
    title = ratio >= WAIT_ABOVE && currentCents - low >= MIN_SAVING ? "Já esteve mais barato" : "Preço dentro do normal";
  }

  return {
    kind,
    title,
    currentCents,
    lowCents: low,
    avgCents: Math.round(weighted / total),
    nearLowCount: nearLowRuns,
    daysAtCurrent,
    atHistoricLow,
    sale: kind === "wait" ? nextSale(now, input.hasSteam) : null,
  };
}
