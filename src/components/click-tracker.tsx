"use client";

import { useEffect } from "react";

/**
 * Registra os cliques nos links marcados com `data-track` (comprar, gift card, produto do Setup). Um único ouvinte
 * na página inteira, então os links continuam sendo links comuns, renderizados no servidor.
 * O envio é em segundo plano (sendBeacon) e nunca atrasa nem impede a abertura da loja.
 */
export function ClickTracker() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      // clique normal (botão 0) e clique com a rodinha (botão 1, abre em nova aba)
      if (e.button > 1) return;
      const link = (e.target as Element | null)?.closest?.("a[data-track]") as HTMLAnchorElement | null;
      if (!link) return;
      const { track, store, game, target } = link.dataset;
      const body = JSON.stringify({ kind: track, store, gameId: game ? Number(game) : undefined, target, page: location.pathname });
      try {
        if (!navigator.sendBeacon?.("/api/click", new Blob([body], { type: "application/json" }))) {
          void fetch("/api/click", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
        }
      } catch {
        // sem rastreio, o link abre do mesmo jeito
      }
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);
  return null;
}
