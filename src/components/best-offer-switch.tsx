"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/icon";
import { serializePlatforms } from "@/lib/platform-selection";
import { usePlatforms } from "@/lib/use-platforms";

export interface BestOfferChoice {
  /** Qual das opções mostrar para esta combinação de plataformas. */
  offerId: number;
  /** true quando o jogo não é vendido nas plataformas escolhidas e mostramos a melhor oferta geral. */
  fallback: boolean;
}

/**
 * Escolhe qual "Melhor drop" mostrar conforme as plataformas marcadas no cabeçalho. A página do jogo continua
 * estática e em cache: o servidor já preparou o cartão de cada oferta que pode ser a melhor para alguma combinação
 * (`options`) e a tabela de qual combinação usa qual (`choices`); aqui só se escolhe.
 */
export function BestOfferSwitch({ choices, options }: { choices: Record<string, BestOfferChoice>; options: Record<number, ReactNode> }) {
  const { platforms } = usePlatforms();
  const choice = choices[serializePlatforms(platforms)] ?? choices[""];
  return (
    <>
      {choice.fallback && (
        <p role="status" className="flex items-start gap-2.5 border-b border-warn-line bg-warn-soft px-5 py-3 text-xs leading-snug text-text">
          <Icon name="alert" className="mt-px size-4 shrink-0 text-warn" />
          <span>Este jogo não está à venda nas plataformas que você escolheu. Mostrando a melhor oferta entre todas.</span>
        </p>
      )}
      {options[choice.offerId]}
    </>
  );
}
