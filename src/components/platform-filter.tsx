"use client";

import type { ReactNode } from "react";
import { usePlatformPref, type PlatformPref } from "@/lib/platform-pref";
import { PLATFORM_FAMILIES, type PlatformFamilyId } from "@/lib/stores";

/**
 * Chips de plataforma acima da tabela de preços. A tabela continua renderizada no servidor:
 * o filtro só marca o contêiner com `data-filter` e o CSS esconde as linhas das outras plataformas.
 */
export function PlatformFilter({
  counts,
  total,
  children,
}: {
  counts: Partial<Record<PlatformFamilyId, number>>;
  /** Total de ofertas (não a soma das contagens: uma oferta Play Anywhere conta em Xbox e em PC). */
  total: number;
  children: ReactNode;
}) {
  const [pref, setPref] = usePlatformPref();
  const families = PLATFORM_FAMILIES.filter((f) => counts[f.id]);
  // preferência salva para uma plataforma que este jogo não tem: mostra todas
  const active: PlatformPref = pref !== "todas" && counts[pref] ? pref : "todas";
  const options: { id: PlatformPref; label: string; count: number }[] = [
    { id: "todas", label: "Todas", count: total },
    ...families.map((f) => ({ id: f.id, label: f.label, count: counts[f.id]! })),
  ];

  return (
    <div data-filter={active}>
      {families.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por plataforma">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={active === o.id}
              onClick={() => setPref(o.id)}
              className={`rounded-[4px] border px-3 py-1.5 font-display text-sm font-semibold uppercase tracking-wide transition ${
                active === o.id ? "border-accent bg-accent text-accent-ink" : "border-line text-text-2 hover:border-accent hover:text-accent"
              }`}
            >
              {o.label} <span className={`tabular ${active === o.id ? "" : "text-muted"}`}>{o.count}</span>
            </button>
          ))}
          {active !== "todas" && <span className="ml-1 text-xs text-muted">Lembramos a sua escolha neste aparelho.</span>}
        </div>
      )}
      {children}
    </div>
  );
}
