"use client";

import { useEffect, useState, type ReactNode } from "react";
import { serializePlatforms } from "@/lib/platform-selection";
import { usePlatforms } from "@/lib/use-platforms";
import type { BestOfferChoice } from "./best-offer-switch";

/**
 * Barra fixa no rodapé do celular com o preço e o botão de comprar da melhor oferta. Aparece enquanto o cartão
 * "Melhor drop" (o elemento #melhor-drop) está fora da tela, para o preço nunca ficar longe do polegar.
 * Como o cartão, segue as plataformas marcadas no cabeçalho; o servidor já preparou uma barra por oferta possível.
 */
export function MobileBuyBar({ choices, options }: { choices: Record<string, BestOfferChoice>; options: Record<number, ReactNode> }) {
  const { platforms } = usePlatforms();
  const choice = choices[serializePlatforms(platforms)] ?? choices[""];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const panel = document.getElementById("melhor-drop");
    if (!panel) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  // os botões flutuantes (feedback e voltar ao topo) sobem para não ficarem atrás da barra (ver globals.css)
  useEffect(() => {
    document.body.toggleAttribute("data-buy-bar", visible);
    return () => document.body.removeAttribute("data-buy-bar");
  }, [visible]);

  return (
    <div
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line-strong bg-bg/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-200 ease-out lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {options[choice.offerId]}
    </div>
  );
}
