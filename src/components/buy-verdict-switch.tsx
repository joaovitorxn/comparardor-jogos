"use client";

import { serializePlatforms } from "@/lib/platform-selection";
import { usePlatforms } from "@/lib/use-platforms";
import type { VerdictView } from "@/lib/verdict-variants";
import { BuyVerdict } from "./buy-verdict";

/** Mostra o veredito da combinação de plataformas marcada no cabeçalho (preparado no servidor, ver verdict-variants). */
export function BuyVerdictSwitch({ choices, views }: { choices: Record<string, string>; views: Record<string, VerdictView> }) {
  const { platforms } = usePlatforms();
  const view = views[choices[serializePlatforms(platforms)] ?? choices[""]];
  return view ? <BuyVerdict verdict={view.verdict} historicLow={view.historicLow} /> : null;
}
