"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition } from "react";
import { setCookie } from "./cookie";
import { parsePlatforms, PLATFORMS_COOKIE, serializePlatforms } from "./platform-selection";
import type { PlatformFamilyId } from "./stores";

const EVENT = "dropou:plataformas";

function readCookie(): string {
  try {
    const match = document.cookie.split("; ").find((c) => c.startsWith(`${PLATFORMS_COOKIE}=`));
    return match ? decodeURIComponent(match.slice(PLATFORMS_COOKIE.length + 1)) : "";
  } catch {
    return "";
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

/**
 * Plataformas escolhidas pela pessoa. Vazio = todas. Ao mudar, grava o cookie e recarrega os dados
 * da página atual (o servidor lê o cookie para filtrar); `pending` indica que isso está em andamento.
 */
export function usePlatforms() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const raw = useSyncExternalStore(subscribe, readCookie, () => "");
  const platforms = parsePlatforms(raw);

  function setPlatforms(next: PlatformFamilyId[]) {
    const value = serializePlatforms(next);
    const oneYear = 60 * 60 * 24 * 365;
    setCookie(PLATFORMS_COOKIE, value, value ? oneYear : 0);
    window.dispatchEvent(new Event(EVENT));
    // em transição, `pending` fica ligado até a página recarregar com os dados novos
    startTransition(() => router.refresh());
  }

  return { platforms, setPlatforms, pending };
}
