import type { IconName } from "@/components/icon";

/** Formas de ver a lista de ofertas; a escolha fica num cookie, para a página já vir montada do jeito certo. */
export const LAYOUT_COOKIE = "dropou_vista";

export const LAYOUTS = [
  { id: "cards", label: "Cards", icon: "grid", pageSize: 30 },
  { id: "compacto", label: "Compacto", icon: "dense", pageSize: 48 },
  { id: "lista", label: "Lista", icon: "list", pageSize: 40 },
  { id: "tabela", label: "Tabela", icon: "table", pageSize: 50 },
] as const satisfies readonly { id: string; label: string; icon: IconName; pageSize: number }[];

export type LayoutId = (typeof LAYOUTS)[number]["id"];

export function parseLayout(value: string | null | undefined): LayoutId {
  return LAYOUTS.find((l) => l.id === value)?.id ?? "cards";
}
