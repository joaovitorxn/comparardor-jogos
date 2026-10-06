"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DISCOUNTS, hasFilters, listHref, PRICE_CAPS, SORTS, type ListParams } from "@/lib/list-params";
import type { LayoutId } from "@/lib/offers-layout";
import { getStore, PLATFORM_FAMILIES } from "@/lib/stores";
import { Icon } from "./icon";
import { LayoutSwitcher } from "./layout-switcher";

interface Option {
  value: string;
  label: string;
}

/** Botão de filtro com menu: mostra o valor escolhido (em destaque) e troca o parâmetro da URL ao escolher. */
function FilterPill({
  label,
  param,
  options,
  anyLabel,
  value,
  onPick,
}: {
  label: string;
  param: keyof ListParams;
  options: Option[];
  anyLabel: string;
  value: string;
  onPick: (param: keyof ListParams, value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);
  const active = Boolean(value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const all: Option[] = [{ value: "", label: anyLabel }, ...options];
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`inline-flex h-9 items-center gap-1.5 rounded-[4px] border px-3 font-display text-sm font-semibold uppercase tracking-wider transition ${
          active ? "border-accent-line bg-accent-soft text-accent" : "border-line text-text-2 hover:border-accent hover:text-accent"
        }`}
      >
        {active ? current?.label : label}
        <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          // no celular o menu sobe do rodapé da tela (nunca estoura a lateral); no computador abre embaixo do botão
          className="fixed inset-x-3 bottom-3 z-50 max-h-[60vh] overflow-y-auto rounded-[6px] border border-line-strong bg-surface-2 p-1.5 shadow-2xl shadow-black/60 sm:absolute sm:inset-auto sm:left-0 sm:top-full sm:mt-2 sm:max-h-80 sm:w-60"
        >
          <li className="px-3 pb-1 pt-1.5 font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted">{label}</li>
          {all.map((o) => (
            <li key={o.value || "any"} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onPick(param, o.value);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-[4px] px-3 py-2 text-left text-sm transition ${
                  o.value === value ? "bg-accent-soft font-medium text-accent" : "text-text-2 hover:bg-surface-3 hover:text-text"
                }`}
              >
                {o.label}
                {o.value === value && (
                  <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12.5 4.5 4.5L19 7" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Barra de controles das listas de jogos (Ofertas e Explorar/Busca): ordenação em botões, filtros em botões
 * com menu e o seletor de visão. Tudo vive na URL, então os links podem ser compartilhados.
 */
export function ListToolbar({
  base,
  params,
  layout,
  genres,
  stores,
}: {
  base: "/ofertas" | "/busca";
  params: ListParams;
  layout: LayoutId;
  genres: string[];
  stores: string[];
}) {
  const router = useRouter();
  const pick = (param: keyof ListParams, value: string) => router.push(listHref(base, params, { [param]: value }), { scroll: false });

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Ordenar" className="flex flex-wrap gap-2">
          {SORTS.map((s) => (
            <Link
              key={s.id}
              href={listHref(base, params, { ordem: s.id })}
              scroll={false}
              aria-current={s.id === params.ordem ? "true" : undefined}
              className={`inline-flex h-9 items-center gap-1.5 rounded-[4px] border px-3 font-display text-sm font-semibold uppercase tracking-wider transition ${
                s.id === params.ordem ? "border-accent bg-accent text-accent-ink" : "border-line text-text-2 hover:border-accent hover:text-accent"
              }`}
            >
              <Icon name={s.icon} className="size-4" />
              {s.label}
            </Link>
          ))}
        </nav>
        <LayoutSwitcher current={layout} />
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtros">
        <FilterPill label="Plataforma" param="plataforma" anyLabel="Todas as plataformas" value={params.plataforma} onPick={pick} options={PLATFORM_FAMILIES.map((f) => ({ value: f.id, label: f.label }))} />
        <FilterPill label="Preço" param="ate" anyLabel="Qualquer preço" value={params.ate} onPick={pick} options={PRICE_CAPS} />
        <FilterPill label="Desconto" param="desconto" anyLabel="Qualquer desconto" value={params.desconto} onPick={pick} options={DISCOUNTS} />
        <FilterPill label="Loja" param="loja" anyLabel="Todas as lojas" value={params.loja} onPick={pick} options={stores.map((id) => ({ value: id, label: getStore(id)?.name ?? id }))} />
        {genres.length > 0 && (
          <FilterPill label="Gênero" param="genero" anyLabel="Todos os gêneros" value={params.genero} onPick={pick} options={genres.map((g) => ({ value: g, label: g }))} />
        )}
        {hasFilters(params) && (
          <Link
            href={listHref(base, params, { plataforma: "", ate: "", desconto: "", loja: "", genero: "" })}
            scroll={false}
            className="px-1 text-xs font-medium text-muted underline-offset-2 hover:text-accent hover:underline"
          >
            Limpar filtros
          </Link>
        )}
      </div>
    </div>
  );
}
