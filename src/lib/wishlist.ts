"use client";

import { useSyncExternalStore } from "react";

/**
 * Lista de desejos guardada no próprio aparelho (sem conta). Se o armazenamento do
 * navegador não estiver disponível (aba anônima, bloqueio), a lista simplesmente fica vazia.
 */
const KEY = "comparador:lista";
const EVENT = "comparador:lista";
const EMPTY: number[] = [];

let cache: { raw: string | null; ids: number[] } = { raw: null, ids: EMPTY };

function read(): number[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.ids;
  let ids = EMPTY;
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (Array.isArray(parsed)) ids = parsed.filter((n): n is number => Number.isInteger(n));
  } catch {
    // conteúdo inválido: recomeça vazia
  }
  cache = { raw, ids };
  return ids;
}

function write(ids: number[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange); // outras abas
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useWishlist() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    ids,
    has: (id: number) => ids.includes(id),
    add: (id: number) => !read().includes(id) && write([id, ...read()]),
    remove: (id: number) => write(read().filter((x) => x !== id)),
  };
}
