"use client";

import { useSyncExternalStore } from "react";
import { PLATFORM_FAMILIES, type PlatformFamilyId } from "./stores";

/** Plataforma preferida (lembrada no aparelho): o filtro da tabela de preços já abre nela. */
export type PlatformPref = "todas" | PlatformFamilyId;

const KEY = "comparador:plataforma";
const EVENT = "comparador:plataforma";
const valid = new Set<string>(["todas", ...PLATFORM_FAMILIES.map((f) => f.id)]);

function read(): PlatformPref {
  try {
    const v = window.localStorage.getItem(KEY);
    return v && valid.has(v) ? (v as PlatformPref) : "todas";
  } catch {
    return "todas";
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

export function usePlatformPref() {
  const pref = useSyncExternalStore(subscribe, read, () => "todas" as PlatformPref);
  const setPref = (value: PlatformPref) => {
    try {
      window.localStorage.setItem(KEY, value);
    } catch {
      // sem armazenamento: o filtro vale só até recarregar a página
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return [pref, setPref] as const;
}
