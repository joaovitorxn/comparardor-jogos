import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";
import { Icon, type IconName } from "./icon";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** Parágrafo de texto corrido das páginas legais. */
export function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed text-text-2">{children}</p>;
}

/** Lista com marcadores da cor do site. */
export function Ul({ children }: { children: ReactNode }) {
  return <ul className="space-y-2 pl-1 text-text-2 [&>li]:relative [&>li]:pl-5 [&>li]:leading-relaxed [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.6em] [&>li]:before:size-1.5 [&>li]:before:rounded-full [&>li]:before:bg-accent">{children}</ul>;
}

/** Destaque dentro de uma seção (por exemplo, "o que isso significa na prática"). */
export function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[6px] border border-accent-line bg-accent-soft p-4">
      <p className="mb-1 font-display text-sm font-bold uppercase tracking-wider text-accent">{title}</p>
      <div className="space-y-2 text-sm leading-relaxed text-text-2">{children}</div>
    </div>
  );
}

/** Tabela simples (dado, para quê, por quanto tempo) com rolagem lateral no celular. */
export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-[6px] border border-line">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead className="border-b border-line bg-surface-2">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-display text-xs font-semibold uppercase tracking-wider text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className="border-b border-line align-top last:border-b-0">
              {cells.map((c, j) => (
                <td key={j} className={`px-3 py-2.5 leading-snug ${j === 0 ? "font-medium text-text" : "text-text-2"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Moldura das páginas de Privacidade e Termos: cabeçalho, resumo em linguagem simples, índice lateral
 * (no computador) e as seções numeradas.
 */
export function LegalPage({
  title,
  icon,
  updated,
  intro,
  summaryTitle,
  summary,
  sections,
  other,
}: {
  title: string;
  icon: IconName;
  updated: string;
  intro: string;
  summaryTitle: string;
  summary: ReactNode[];
  sections: LegalSection[];
  other: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <header className="mb-8 overflow-hidden rounded-card border border-line bg-surface">
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-accent opacity-[0.07] blur-3xl" />
          <span className="mb-4 flex size-12 items-center justify-center rounded-[8px] border border-accent-line bg-accent-soft text-accent">
            <Icon name={icon} className="size-6" />
          </span>
          <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-text-2">{intro}</p>
          <p className="mt-4 text-xs text-muted">
            Última atualização: <time dateTime="2026-10-06">{updated}</time> · {BRAND.name} está em fase beta e estas regras podem evoluir.
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="Nesta página" className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted">Nesta página</p>
            {sections.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} className="flex items-baseline gap-2 rounded-[4px] px-2 py-1.5 text-sm text-text-2 transition hover:bg-surface-2 hover:text-accent">
                <span className="tabular w-5 shrink-0 font-display text-xs font-bold text-muted">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </a>
            ))}
            <Link href={other.href} className="mt-4 block rounded-[4px] border border-line px-3 py-2 text-sm text-text-2 transition hover:border-accent hover:text-accent">
              {other.label} →
            </Link>
          </div>
        </nav>

        <div className="min-w-0 space-y-6">
          <section className="rounded-card border border-accent-line bg-surface p-6">
            <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wide">
              <Icon name="bolt" className="size-5 text-accent" />
              {summaryTitle}
            </h2>
            <ul className="space-y-2.5 text-text-2">
              {summary.map((item, i) => (
                <li key={i} className="flex gap-3 leading-relaxed">
                  <span aria-hidden className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12.5 4.5 4.5L19 7" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 rounded-card border border-line bg-surface p-6">
              <h2 className="mb-4 flex items-baseline gap-3 font-display text-2xl font-bold uppercase leading-tight tracking-wide">
                <span className="tabular text-accent">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className="space-y-4">{s.body}</div>
            </section>
          ))}

          <p className="px-1 text-xs leading-relaxed text-muted">
            Este texto explica, em linguagem simples, como o {BRAND.name} funciona hoje. Se algo estiver diferente do que você vê no site, ou se ficar
            alguma dúvida, fale comigo pelo botão de feedback.
          </p>
        </div>
      </div>
    </div>
  );
}
