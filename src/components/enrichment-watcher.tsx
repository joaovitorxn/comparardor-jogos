"use client";

import { useEffect, useState } from "react";
import { refreshGamePage } from "@/app/jogo/[slug]/actions";

const POLL_MS = 1500;
const GIVE_UP_MS = 45_000;

/**
 * Mostrado enquanto o jogo, recém-importado pela busca, é procurado nas outras lojas.
 * Quando termina, recarrega a página com as novas ofertas.
 */
export function EnrichmentWatcher({ gameId, slug }: { gameId: number; slug: string }) {
  const [status, setStatus] = useState<"waiting" | "timeout">("waiting");

  useEffect(() => {
    let stopped = false;
    const startedAt = Date.now();

    async function poll() {
      if (stopped) return;
      try {
        const res = await fetch(`/api/jogos/${gameId}/status`, { cache: "no-store" });
        const data = (await res.json()) as { enriched?: boolean };
        if (data.enriched) {
          await refreshGamePage(slug);
          return;
        }
      } catch {
        // falha momentânea de rede: tenta de novo no próximo ciclo
      }
      if (Date.now() - startedAt > GIVE_UP_MS) {
        setStatus("timeout");
        return;
      }
      setTimeout(poll, POLL_MS);
    }

    const timer = setTimeout(poll, POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [gameId, slug]);

  return (
    <div role="status" className="flex items-center gap-3 rounded-card border border-accent-line bg-accent-soft px-4 py-3 text-sm">
      {status === "waiting" ? (
        <>
          <span aria-hidden className="size-4 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span>
            <span className="font-medium text-text">Procurando este jogo nas outras lojas…</span>{" "}
            <span className="text-text-2">Epic, Nuuvem, GOG e outras aparecem aqui em alguns segundos.</span>
          </span>
        </>
      ) : (
        <span className="text-text-2">As outras lojas estão demorando para responder. Recarregue a página em instantes para ver mais ofertas.</span>
      )}
    </div>
  );
}
