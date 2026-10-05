"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { SearchForm } from "./search-form";

/**
 * Busca no celular: um botão de lupa no cabeçalho que abre a barra de busca logo abaixo.
 * A barra fecha sozinha ao navegar para outra página.
 */
export function MobileSearch() {
  const pathname = usePathname();
  // guarda em qual página a barra foi aberta: ao navegar, ela deixa de valer sem precisar de efeito
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  return (
    <div className="ml-auto sm:hidden">
      <button
        type="button"
        onClick={() => setOpenOn(open ? null : pathname)}
        aria-label={open ? "Fechar busca" : "Buscar jogo"}
        aria-expanded={open}
        className={`flex size-10 items-center justify-center rounded-[4px] transition ${open ? "text-accent" : "text-text-2 hover:text-accent"}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-bg px-4 py-3 shadow-xl shadow-black/40">
          <SearchForm autoFocus />
        </div>
      )}
    </div>
  );
}
