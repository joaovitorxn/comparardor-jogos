import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

/**
 * Seção que começa fechada (um <details> comum: abre com clique, Enter ou espaço). O conteúdo continua na página,
 * então não some para os buscadores; só deixa a página mais curta para quem não precisa dele agora.
 */
export function CollapsibleSection({ title, icon, aside, children }: { title: string; icon: IconName; aside?: ReactNode; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line pb-2.5 [&::-webkit-details-marker]:hidden">
        <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold uppercase tracking-wide">
          <Icon name={icon} className="size-5 text-accent" />
          {title}
        </h2>
        <span className="flex items-center gap-2 text-xs text-muted">
          {aside}
          <span className="group-open:hidden">Mostrar</span>
          <span className="hidden group-open:inline">Ocultar</span>
          <svg viewBox="0 0 24 24" aria-hidden className="size-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </summary>
      <div className="pt-4">{children}</div>
    </details>
  );
}
