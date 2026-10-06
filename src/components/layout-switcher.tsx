"use client";

import { useRouter } from "next/navigation";
import { setCookie } from "@/lib/cookie";
import { LAYOUT_COOKIE, LAYOUTS, type LayoutId } from "@/lib/offers-layout";
import { Icon } from "./icon";

/** Escolhe como as ofertas aparecem (cards, compacto, lista ou tabela) e lembra a escolha neste aparelho. */
export function LayoutSwitcher({ current }: { current: LayoutId }) {
  const router = useRouter();

  function choose(id: LayoutId) {
    if (id === current) return;
    setCookie(LAYOUT_COOKIE, id, 60 * 60 * 24 * 365);
    router.refresh();
  }

  return (
    <div role="group" aria-label="Forma de exibir as ofertas" className="flex overflow-hidden rounded-[4px] border border-line">
      {LAYOUTS.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => choose(l.id)}
          aria-pressed={l.id === current}
          aria-label={l.label}
          title={l.label}
          className={`flex h-9 w-10 items-center justify-center border-r border-line transition last:border-r-0 ${
            l.id === current ? "bg-accent text-accent-ink" : "text-text-2 hover:bg-surface-2 hover:text-accent"
          }`}
        >
          <Icon name={l.icon} className="size-[18px]" />
        </button>
      ))}
    </div>
  );
}
