"use client";

import { lightImage } from "@/lib/images";
import Form from "next/form";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { formatCents } from "@/lib/format";
import { usePlatforms } from "@/lib/use-platforms";

interface Suggestion {
  slug: string;
  title: string;
  coverUrl: string | null;
  price: { cents: number; discountPercent: number } | null;
}

/**
 * Barra de busca com autocompletar: enquanto a pessoa digita, mostra até 3 jogos do catálogo
 * (com tolerância a erros de digitação). Enter sem escolher uma sugestão vai para /busca.
 */
export function SearchForm({ defaultValue, className = "", size = "md", autoFocus = false }: { defaultValue?: string; className?: string; size?: "md" | "lg"; autoFocus?: boolean }) {
  const lg = size === "lg";
  const router = useRouter();
  const listId = useId();
  const { platforms } = usePlatforms();
  const platformsKey = platforms.join(",");
  const [value, setValue] = useState(defaultValue ?? "");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const requestRef = useRef<AbortController | null>(null);

  // busca as sugestões com um pequeno atraso, cancelando a anterior se a pessoa continuar digitando
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) return;
    const timer = setTimeout(async () => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;
      try {
        const qs = new URLSearchParams({ q });
        if (platformsKey) qs.set("plataformas", platformsKey);
        const res = await fetch(`/api/busca/sugestoes?${qs}`, { signal: controller.signal });
        const data = (await res.json()) as { suggestions: Suggestion[] };
        setItems(data.suggestions);
        setActive(-1);
      } catch {
        // cancelada ou falhou: mantém as sugestões anteriores
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [value, platformsKey]);

  const visible = open && value.trim().length >= 2 && items.length > 0;
  // a última opção é sempre "ver todos os resultados"
  const optionCount = items.length + 1;

  function go(index: number) {
    setOpen(false);
    if (index >= 0 && index < items.length) router.push(`/jogo/${items[index].slug}`);
    else router.push(`/busca?q=${encodeURIComponent(value.trim())}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!visible) {
      if (e.key === "ArrowDown" && items.length) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % optionCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? optionCount - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      go(active);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <Form action="/busca" className={`relative ${className}`} role="search" onSubmit={() => setOpen(false)}>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-muted ${lg ? "left-4 size-5" : "left-3 size-4"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        name="q"
        type="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="Buscar jogo"
        aria-label="Buscar jogo"
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className={`w-full rounded-[4px] border border-line bg-surface text-text placeholder:text-muted transition focus:border-accent focus:bg-surface-2 focus:outline-none ${
          lg ? "h-12 pl-12 pr-4 text-base" : "h-9 pl-9 pr-3 text-sm"
        }`}
      />

      {visible && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Sugestões"
          className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-[4px] border border-line-strong bg-surface-2 shadow-2xl shadow-black/50"
        >
          {items.map((s, i) => (
            <li
              key={s.slug}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={active === i}
              // mousedown (não click): dispara antes do blur fechar a lista
              onMouseDown={(e) => {
                e.preventDefault();
                go(i);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${active === i ? "bg-surface-3" : ""}`}
            >
              <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-[3px] bg-surface-3">
                {s.coverUrl && <Image src={lightImage(s.coverUrl)} alt="" fill sizes="36px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.title}</span>
              {s.price && (
                <span className="flex shrink-0 items-center gap-1.5 text-sm">
                  {s.price.discountPercent > 0 && (
                    <span className="tabular rounded-[3px] bg-accent px-1 font-display text-xs font-bold text-accent-ink">-{s.price.discountPercent}%</span>
                  )}
                  <span className="tabular font-semibold">{s.price.cents === 0 ? "Grátis" : formatCents(s.price.cents)}</span>
                </span>
              )}
            </li>
          ))}
          <li
            id={`${listId}-${items.length}`}
            role="option"
            aria-selected={active === items.length}
            onMouseDown={(e) => {
              e.preventDefault();
              go(items.length);
            }}
            onMouseEnter={() => setActive(items.length)}
            className={`cursor-pointer border-t border-line px-3 py-2 text-xs text-text-2 ${active === items.length ? "bg-surface-3 text-text" : ""}`}
          >
            Ver todos os resultados para “{value.trim()}” →
          </li>
        </ul>
      )}
    </Form>
  );
}
