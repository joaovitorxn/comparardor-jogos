import type { HistoricLow } from "@/db/queries";
import { formatCents } from "@/lib/format";
import { getStore } from "@/lib/stores";
import type { Verdict } from "@/lib/verdict";
import { Icon, type IconName } from "./icon";

const KINDS: Record<Verdict["kind"], { label: string; icon: IconName; badge: string; accent: string }> = {
  buy: { label: "Bom momento", icon: "check", badge: "border-accent-line bg-accent-soft text-accent", accent: "text-accent" },
  wait: { label: "Vale esperar", icon: "hourglass", badge: "border-warn-line bg-warn-soft text-warn", accent: "text-warn" },
  neutral: { label: "Sem pressa", icon: "clock", badge: "border-line text-text-2", accent: "text-text-2" },
};

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Linha "Preço histórico": o menor preço já visto, com data e loja quando se sabe. */
function HistoricRow({ low }: { low: HistoricLow }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
      <dt className="flex items-center gap-1.5 text-muted">
        <Icon name="floor" className="size-4" />
        Preço histórico
      </dt>
      <dd className="text-right">
        <span className="tabular font-semibold">{formatCents(low.cents)}</span>
        {low.date && (
          <span className="block text-xs text-muted">
            {dateFmt.format(low.date)}
            {low.store && ` · ${getStore(low.store)?.name ?? low.store}`}
          </span>
        )}
      </dd>
    </div>
  );
}

/**
 * Resposta curta para "compro agora ou espero?", calculada pelo histórico de preços (ver lib/verdict),
 * junto do menor preço já registrado. Sem veredito (histórico curto), mostra só o preço histórico.
 */
export function BuyVerdict({ verdict, historicLow }: { verdict: Verdict | null; historicLow: HistoricLow | null }) {
  if (!verdict) {
    if (!historicLow) return null;
    return (
      <div className="rounded-card border border-line bg-surface">
        <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.15em] text-text-2">
          <Icon name="floor" className="size-4 text-accent" />
          Histórico de preço
        </h2>
        <dl className="text-sm">
          <HistoricRow low={historicLow} />
        </dl>
        <p className="border-t border-line px-5 py-2 text-[11px] text-muted">Ainda sem histórico suficiente para dizer se vale esperar.</p>
      </div>
    );
  }

  const k = KINDS[verdict.kind];
  const saving = verdict.currentCents - verdict.lowCents;

  const notes: { icon: IconName; text: string }[] = [];
  if (verdict.kind === "wait") {
    notes.push({ icon: "floor", text: `No último ano já custou ${formatCents(verdict.lowCents)}, ${formatCents(saving)} a menos que hoje.` });
  }
  if (verdict.nearLowCount > 0 && verdict.kind !== "buy") {
    notes.push({ icon: "chart", text: `Chegou perto desse preço ${plural(verdict.nearLowCount, "vez", "vezes")} nos últimos 12 meses.` });
  }
  if (verdict.kind === "buy") {
    if (verdict.daysAtCurrent != null) {
      notes.push({
        icon: "clock",
        text: verdict.daysAtCurrent < 1 ? "Esse preço começou hoje." : `Esse preço está valendo há ${plural(verdict.daysAtCurrent, "dia", "dias")}.`,
      });
    }
    if (verdict.belowAverage) {
      notes.push({ icon: "chart", text: `Abaixo da média dos últimos 12 meses (${formatCents(verdict.avgCents)}).` });
    } else if (verdict.nearLowCount > 1) {
      notes.push({ icon: "chart", text: `Já chegou perto dele ${plural(verdict.nearLowCount, "vez", "vezes")} nos últimos 12 meses.` });
    }
  }
  if (verdict.sale) {
    const { name, days, approx } = verdict.sale;
    const when = days === 0 ? "começa hoje" : days === 1 ? "começa amanhã" : `${approx ? "por volta de " : ""}em ${days} dias`;
    notes.push({ icon: "calendar", text: `${name}: ${when}. Costuma ter descontos maiores.` });
  }

  return (
    <div className="rounded-card border border-line bg-surface">
      <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.15em] text-text-2">
        <Icon name={k.icon} className={`size-4 ${k.accent}`} />
        Vale esperar?
      </h2>
      <div className="space-y-2 px-5 py-4">
        <span className={`inline-flex items-center rounded-[3px] border px-1.5 py-px text-[11px] font-medium uppercase leading-4 tracking-wider ${k.badge}`}>{k.label}</span>
        <p className="font-display text-2xl font-bold leading-tight">{verdict.title}</p>
      </div>
      {notes.length > 0 && (
        <ul className="space-y-2 px-5 pb-4 text-sm text-text-2">
          {notes.map((n) => (
            <li key={n.text} className="flex items-start gap-2.5">
              <Icon name={n.icon} className="mt-0.5 size-4 shrink-0 text-muted" />
              <span>{n.text}</span>
            </li>
          ))}
        </ul>
      )}
      <dl className="divide-y divide-line border-t border-line text-sm">
        {historicLow && <HistoricRow low={historicLow} />}
        {(!historicLow || historicLow.cents !== verdict.lowCents) && (
          <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
            <dt className="text-muted">Menor em 12 meses</dt>
            <dd className="tabular font-semibold">{formatCents(verdict.lowCents)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
          <dt className="text-muted">Média em 12 meses</dt>
          <dd className="tabular">{formatCents(verdict.avgCents)}</dd>
        </div>
      </dl>
      <p className="border-t border-line px-5 py-2 text-[11px] text-muted">Estimativa pelo histórico de preços. Não é garantia de que o preço vai cair.</p>
    </div>
  );
}
