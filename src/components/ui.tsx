import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import { formatCents } from "@/lib/format";

export function SectionHeader({ title, aside, id, icon }: { title: string; aside?: ReactNode; id?: string; icon?: IconName }) {
  return (
    <div id={id} className="mb-4 flex scroll-mt-24 flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-line pb-2.5">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold uppercase tracking-wide">
        {icon ? <Icon name={icon} className="size-5 text-accent" /> : <span aria-hidden className="h-4 w-1 bg-accent" />}
        {title}
      </h2>
      {aside && <div className="text-xs text-muted">{aside}</div>}
    </div>
  );
}

export function DiscountBadge({ percent, size = "md", className = "" }: { percent: number; size?: "sm" | "md" | "lg" | "xl" | "hero"; className?: string }) {
  const sizes = { sm: "px-1 text-xs", md: "px-1.5 py-0.5 text-sm", lg: "px-2 py-0.5 text-lg", xl: "px-2.5 py-1 text-2xl", hero: "px-3 pb-1 pt-0.5 text-6xl lg:text-7xl" };
  return (
    <span className={`drop-tag tabular inline-block rounded-l-[3px] bg-accent font-display font-bold leading-tight text-accent-ink ${sizes[size]} ${className}`}>
      -{percent}%
    </span>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "warn" }) {
  const tones = {
    // três níveis: neutro (informação, sem borda), accent (destaque suave) e warn (aviso); o cheio em verde fica só para desconto e ação
    neutral: "border-transparent bg-surface-3 text-text-2",
    accent: "border-accent-line bg-accent-soft text-accent",
    warn: "border-warn-line bg-warn-soft text-warn",
  };
  return (
    <span className={`inline-flex items-center rounded-[3px] border px-1.5 py-px text-xs font-medium leading-4 ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function PriceText({ cents, className = "" }: { cents: number; className?: string }) {
  return <span className={`tabular ${className}`}>{cents === 0 ? "Grátis" : formatCents(cents)}</span>;
}

export function MetacriticBadge({ score, label = "Nota no Metacritic" }: { score: number; label?: string }) {
  const tone = score >= 75 ? "bg-[#3bb143] text-white" : score >= 50 ? "bg-[#f5c518] text-black" : "bg-danger text-white";
  return (
    <span
      title={label}
      className={`tabular inline-flex size-9 items-center justify-center rounded-[4px] font-display text-lg font-bold ${tone}`}
    >
      {score}
    </span>
  );
}

export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-[4px] bg-accent px-4 py-2.5 font-display text-base font-bold uppercase tracking-wide text-accent-ink transition hover:brightness-110",
  primarySm:
    "inline-flex items-center justify-center gap-2 rounded-[4px] bg-accent px-3 py-1.5 font-display text-sm font-bold uppercase tracking-wide text-accent-ink transition hover:brightness-110",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-[4px] border border-line-strong bg-surface-2 px-3 py-1.5 text-xs font-medium text-text transition hover:border-accent hover:text-accent",
};

/** Cabeçalho discreto dos cartões de apoio (ficha, tempo para zerar, idiomas): informação de consulta, sem chamar atenção. */
export const quietHeader = "flex items-center gap-2 border-b border-line px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted";
