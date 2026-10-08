"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import { NOVIDADES } from "@/lib/novidades";
import { Icon } from "./icon";
import { Tag } from "./ui";

/** Última novidade que a pessoa já viu, guardada no aparelho (sem conta). Se o armazenamento falhar, só não lembra. */
const KEY = "dropou:novidades";
const EVENT = "dropou:novidades";
const LATEST = NOVIDADES[0].id;

function readSeen(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

/**
 * "Novidades": botão discreto no cabeçalho, com um pontinho enquanto houver novidade que a pessoa ainda não viu,
 * que abre uma janela com as últimas funcionalidades (a lista fica em lib/novidades.ts).
 */
export function WhatsNew() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  // ids que eram novos quando a janela abriu: continuam marcados "Novo" enquanto ela fica aberta
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  // no servidor conta como "já visto" (sem pontinho); o navegador corrige logo depois
  const seen = useSyncExternalStore(subscribe, readSeen, () => LATEST);
  const hasNew = seen !== LATEST;

  function show() {
    const seenIndex = NOVIDADES.findIndex((n) => n.id === seen);
    setFresh(new Set((seenIndex === -1 ? NOVIDADES : NOVIDADES.slice(0, seenIndex)).map((n) => n.id)));
    setOpen(true);
    dialog.current?.showModal();
    try {
      window.localStorage.setItem(KEY, LATEST);
    } catch {
      // sem armazenamento: o pontinho volta na próxima visita
    }
    window.dispatchEvent(new Event(EVENT));
  }

  function hide() {
    dialog.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-label={hasNew ? "Novidades (tem novidade que você ainda não viu)" : "Novidades"}
        className="relative after:absolute after:-inset-2 after:content-[''] flex shrink-0 items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-text-2 transition hover:text-accent"
      >
        <Icon name="sparkles" className="size-5" />
        <span className="hidden lg:inline">Novidades</span>
        {hasNew && <span aria-hidden className="absolute -right-1 -top-1 size-2 rounded-full bg-accent lg:-right-2" />}
      </button>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && hide()}
        aria-label="Novidades do Dropou"
        className="m-auto max-h-[85vh] w-[min(92vw,28rem)] overflow-y-auto rounded-card border border-line-strong bg-surface-2 p-0 text-text shadow-2xl shadow-black/70 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {open && (
          <div className="p-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wide">
                <Icon name="sparkles" className="size-5 text-accent" />
                Novidades
              </p>
              <button type="button" onClick={hide} aria-label="Fechar" className="-mr-1 p-1 text-2xl leading-none text-muted hover:text-text">
                ×
              </button>
            </div>
            <p className="mb-3 text-xs text-muted">O que chegou por aqui ultimamente.</p>

            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
              {NOVIDADES.map((n) => (
                <li key={n.id} className="flex gap-3 p-3.5">
                  <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-[4px] border border-accent-line bg-accent-soft text-accent">
                    <Icon name={n.icon} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-medium">{n.title}</p>
                      {fresh.has(n.id) && <Tag tone="accent">Novo</Tag>}
                      <span className="ml-auto text-xs text-muted">{dateFmt.format(new Date(`${n.date}T12:00:00`))}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-text-2">{n.text}</p>
                    {n.link && (
                      <Link href={n.link.href} onClick={hide} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                        {n.link.label} <span aria-hidden>→</span>
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </dialog>
    </>
  );
}
