"use client";

import { useState } from "react";
import type { SteamStoreItem } from "@/collectors/steam";
import { formatCents } from "@/lib/format";
import { CoverImage } from "./cover-image";
import { StoreLogo } from "./store-logo";
import { DiscountBadge } from "./ui";

/**
 * Jogo da Steam que ainda não está no catálogo. Leva para /steam/[appid], que importa o
 * jogo na hora (~1s) — por isso o card mostra um estado de carregamento ao ser clicado.
 */
export function SteamResultCard({ item }: { item: SteamStoreItem }) {
  const [loading, setLoading] = useState(false);
  const price = item.price;

  return (
    // <a> e não <Link>: o destino é um Route Handler que redireciona
    <a
      href={`/steam/${item.appId}`}
      onClick={() => setLoading(true)}
      aria-busy={loading}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-accent-line"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-surface-2">
        <CoverImage src={item.coverUrl} title={item.name} sizes="(min-width: 1280px) 220px, (min-width: 768px) 22vw, 45vw" className="transition duration-500 group-hover:scale-[1.03]" />
        {price && price.discountPercent > 0 && (
          <span className="absolute left-0 top-3">
            <DiscountBadge percent={price.discountPercent} className="rounded-l-none pl-2" />
          </span>
        )}
        {loading && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg/80 text-sm font-medium">
            <span aria-hidden className="size-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Buscando preços…
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-text group-hover:text-accent">{item.name}</p>
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="min-w-0">
            {price ? (
              <>
                {price.discountPercent > 0 && <p className="tabular text-[11px] leading-none text-muted line-through">{formatCents(price.regularPriceCents)}</p>}
                <p className="tabular font-display text-xl font-bold leading-tight text-text">{price.priceCents === 0 ? "Grátis" : formatCents(price.priceCents)}</p>
              </>
            ) : (
              <span className="text-sm text-muted">Sem preço</span>
            )}
          </div>
          <span className="flex items-center gap-1.5 text-[11px] text-muted" title="Preço da Steam — as outras lojas são buscadas ao abrir">
            Comparar
            <StoreLogo store="steam" size={22} />
          </span>
        </div>
      </div>
    </a>
  );
}
