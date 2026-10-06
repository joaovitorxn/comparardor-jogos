import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import type { Rarity } from "@/lib/rarity";
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

export function DiscountBadge({ percent, size = "md", className = "" }: { percent: number; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const sizes = { sm: "px-1 text-xs", md: "px-1.5 py-0.5 text-sm", lg: "px-2 py-0.5 text-lg", xl: "px-2.5 py-1 text-2xl" };
  return (
    <span className={`tabular inline-block rounded-[3px] bg-accent font-display font-bold leading-tight text-accent-ink ${sizes[size]} ${className}`}>
      -{percent}%
    </span>
  );
}

/** Selo de raridade do desconto (raro, épico, lendário, mítico), pela cor do tier. */
export function RarityTag({ rarity }: { rarity: Rarity }) {
  const color = `var(--rarity-${rarity.id})`;
  return (
    <span
      className="inline-flex items-center rounded-[3px] border px-1.5 py-px text-[11px] font-semibold uppercase leading-4 tracking-wider"
      style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      {rarity.label}
    </span>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "coupon" }) {
  const tones = {
    neutral: "border-line text-text-2",
    accent: "border-accent-line bg-accent-soft text-accent",
    coupon: "border-coupon/40 bg-coupon-soft text-coupon",
  };
  return (
    <span className={`inline-flex items-center rounded-[3px] border px-1.5 py-px text-[11px] font-medium leading-4 ${tones[tone]}`}>
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
