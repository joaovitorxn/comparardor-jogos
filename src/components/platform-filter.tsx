"use client";

import { useState, type ReactNode } from "react";
import { PlatformIcon } from "./store-logo";
import { usePlatforms } from "@/lib/use-platforms";
import { PLATFORM_FAMILIES, type PlatformFamilyId } from "@/lib/stores";

type PlatformPref = "todas" | PlatformFamilyId;

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
  const { platforms } = usePlatforms();
  // a aba abre na única plataforma escolhida no cabeçalho (com várias, ou nenhuma, abre em "Todas");
  // trocar de aba aqui vale só para esta página — a escolha do cabeçalho não muda
  const [picked, setPref] = useState<PlatformPref | null>(null);
  const families = PLATFORM_FAMILIES.filter((f) => counts[f.id]);
  const wanted: PlatformPref = picked ?? (platforms.length === 1 ? platforms[0] : "todas");
  // plataforma que este jogo não tem: mostra todas
  const active: PlatformPref = wanted !== "todas" && counts[wanted] ? wanted : "todas";
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
              <span className="inline-flex items-center gap-1.5">
                <PlatformIcon family={o.id} />
                {o.label}
              </span>{" "}
              <span className={`tabular ${active === o.id ? "" : "text-muted"}`}>{o.count}</span>
            </button>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
