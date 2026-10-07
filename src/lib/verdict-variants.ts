import type { GamePageData, HistoricLow } from "@/db/queries";
import { allPlatformCombinations, serializePlatforms } from "./platform-selection";
import { offerFamilies } from "./stores";
import { computeVerdict, type Verdict } from "./verdict";

export interface VerdictView {
  verdict: Verdict | null;
  historicLow: HistoricLow | null;
}

/**
 * Veredito e preço histórico para cada combinação de plataformas escolhida no cabeçalho: quem joga no PlayStation
 * não quer saber do menor preço da chave de PC. A página continua estática; o servidor prepara as combinações
 * (iguais são reaproveitadas) e o cliente só escolhe qual mostrar, como no "Melhor drop".
 */
export function buildVerdictViews(data: GamePageData): { choices: Record<string, string>; views: Record<string, VerdictView> } {
  const priced = data.offers.filter((o) => o.snapshot && o.finalCents != null);
  const choices: Record<string, string> = {};
  const views: Record<string, VerdictView> = {};

  for (const combo of [[], ...allPlatformCombinations()]) {
    const mine = combo.length ? priced.filter((o) => offerFamilies(o.listing).some((f) => combo.includes(f))) : priced;
    // sem oferta nas plataformas escolhidas: o "Melhor drop" mostra a melhor geral, e o veredito acompanha
    const offers = mine.length ? mine : priced;
    if (!offers.length) continue;

    const stores = new Set(offers.map((o) => o.listing.store));
    const currentCents = offers[0].finalCents!;
    const key = `${currentCents}|${[...stores].sort().join(",")}`;
    choices[serializePlatforms(combo)] = key;
    if (views[key]) continue;

    const series = data.series.filter((s) => stores.has(s.store));
    const all = stores.size === new Set(priced.map((o) => o.listing.store)).size;
    let historicLow: HistoricLow | null = all ? data.historicLow : null;
    if (!all) {
      for (const s of series) {
        for (const [at, cents] of s.points) {
          if (cents > 0 && (!historicLow || cents < historicLow.cents)) historicLow = { cents, date: new Date(at), store: s.store };
        }
      }
    }
    views[key] = {
      verdict: computeVerdict({ series, currentCents, historicLowCents: historicLow?.cents ?? null, now: data.generatedAt, hasSteam: stores.has("steam") }),
      historicLow,
    };
  }
  return { choices, views };
}
