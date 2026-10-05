import type { TimeToBeat } from "@/db/schema";
import { formatCents, formatDuration } from "@/lib/format";

const ROWS = [
  { key: "hastily", label: "Só a história", hint: "jogando direto" },
  { key: "normally", label: "Normal", hint: "história e extras" },
  { key: "completely", label: "100%", hint: "tudo completo" },
] as const;

export function TimeToBeatCard({ ttb, bestPriceCents }: { ttb: TimeToBeat; bestPriceCents: number | null }) {
  const rows = ROWS.filter((r) => ttb[r.key] != null);
  if (!rows.length) return null;
  const longest = Math.max(...rows.map((r) => ttb[r.key]!));
  const reference = ttb.normally ?? ttb.hastily;
  const perHour = bestPriceCents != null && bestPriceCents > 0 && reference ? Math.round(bestPriceCents / (reference / 3600)) : null;

  return (
    <div className="rounded-card border border-line bg-surface">
      <h2 className="border-b border-line px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.15em] text-text-2">Tempo para zerar</h2>
      <dl className="space-y-3 px-5 py-4">
        {rows.map((r) => {
          const seconds = ttb[r.key]!;
          return (
            <div key={r.key}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <dt>
                  {r.label} <span className="text-xs text-muted">· {r.hint}</span>
                </dt>
                <dd className="tabular font-display text-lg font-bold leading-none">{formatDuration(seconds)}</dd>
              </div>
              {/* trilho na mesma família de cor do preenchimento */}
              <div className="mt-1.5 h-1 rounded-full bg-surface-3" aria-hidden>
                <div className="h-full rounded-full bg-text-2" style={{ width: `${Math.max(4, (seconds / longest) * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </dl>
      <div className="flex items-baseline justify-between gap-3 border-t border-line px-5 py-2.5 text-sm">
        {perHour != null ? (
          <>
            <span className="text-muted">Custo por hora</span>
            <span className="tabular font-semibold text-accent">{formatCents(perHour)}/h</span>
          </>
        ) : (
          <span className="text-muted">Tempo informado por jogadores</span>
        )}
      </div>
      <p className="border-t border-line px-5 py-2 text-[11px] text-muted">
        Média de {ttb.count} {ttb.count === 1 ? "jogador" : "jogadores"} no IGDB
      </p>
    </div>
  );
}
