import Link from "next/link";

/** Páginas visíveis: sempre pelo menos 4 números seguidos, mais a primeira e a última, com reticências nos saltos. */
function pageWindow(page: number, totalPages: number): (number | "…")[] {
  const run = 4;
  const start = Math.max(1, Math.min(page - 1, totalPages - run + 1));
  const around = Array.from({ length: Math.min(run, totalPages) }, (_, i) => start + i);
  const pages = new Set([1, totalPages, ...around]);
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("…");
    result.push(p);
  });
  return result;
}

export function Pagination({ page, totalPages, hrefFor }: { page: number; totalPages: number; hrefFor: (page: number) => string }) {
  if (totalPages <= 1) return null;
  const base = "inline-flex h-9 min-w-9 items-center justify-center rounded-[4px] border px-3 font-display text-sm font-semibold transition";
  return (
    <nav aria-label="Paginação" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={`${base} border-line text-text-2 hover:border-accent hover:text-accent`}>
          ‹ Anterior
        </Link>
      )}
      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${base} tabular ${p === page ? "border-accent bg-accent text-accent-ink" : "border-line text-text-2 hover:border-accent hover:text-accent"}`}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link href={hrefFor(page + 1)} className={`${base} border-line text-text-2 hover:border-accent hover:text-accent`}>
          Próxima ›
        </Link>
      )}
    </nav>
  );
}

/** Lê `?pagina=` com segurança (inteiro ≥ 1). */
export function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}
