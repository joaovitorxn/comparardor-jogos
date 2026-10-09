import type { HistoricLow } from "@/db/queries";
import { formatCents } from "@/lib/format";
import { getStore } from "@/lib/stores";
import type { Verdict } from "@/lib/verdict";
import { Icon, type IconName } from "./icon";
import { quietHeader } from "./ui";

const KINDS: Record<Verdict["kind"], { label: string; icon: IconName; frame: string; disc: string; accent: string }> = {
  buy: { label: "Bom momento", icon: "check", frame: "border-accent-line", disc: "bg-accent text-accent-ink", accent: "text-accent" },
  wait: { label: "Vale esperar", icon: "hourglass", frame: "border-warn-line", disc: "bg-warn text-bg", accent: "text-warn" },
  neutral: { label: "Sem pressa", icon: "clock", frame: "border-line-strong", disc: "bg-surface-3 text-text-2", accent: "text-text-2" },
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
        <h2 className={quietHeader}>
          <Icon name="floor" className="size-4" />
          Histórico de preço
        </h2>
        <dl className="text-sm">
          <HistoricRow low={historicLow} />
        </dl>
        <p className="border-t border-line px-5 py-2 text-xs text-muted">Ainda sem histórico suficiente para dizer se vale esperar.</p>
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
    <div className={`rounded-card border bg-surface ${k.frame}`}>
      {/* o veredito é a resposta da página: o rótulo vem grande e colorido, com o motivo logo abaixo */}
      <div className="flex items-center gap-3.5 px-5 pt-5">
        <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${k.disc}`}>
          <Icon name={k.icon} className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.15em] text-text-2">Vale esperar?</h2>
          <p className={`font-display text-3xl font-bold uppercase leading-none ${k.accent}`}>{k.label}</p>
        </div>
      </div>
      <p className="px-5 pb-3 pt-3.5 font-display text-xl font-bold leading-tight">{verdict.title}</p>
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
      <p className="border-t border-line px-5 py-2 text-xs text-muted">Estimativa pelo histórico de preços. Não é garantia de que o preço vai cair.</p>
    </div>
  );
}
