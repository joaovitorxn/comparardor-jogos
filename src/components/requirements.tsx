import type { PcRequirements, RequirementItem } from "@/db/schema";

function Column({ title, items }: { title: string; items: RequirementItem[] }) {
  return (
    <div className="min-w-0 rounded-card border border-line bg-surface">
      <h3 className="border-b border-line px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-text-2">{title}</h3>
      <dl className="divide-y divide-line text-sm">
        {items.map((item, i) =>
          item.label ? (
            <div key={i} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 px-4 py-2">
              <dt className="text-muted">{item.label}</dt>
              <dd className="break-words text-text">{item.value}</dd>
            </div>
          ) : (
            <p key={i} className="px-4 py-2 text-xs text-text-2">
              {item.value}
            </p>
          ),
        )}
      </dl>
    </div>
  );
}

export function Requirements({ requirements }: { requirements: PcRequirements }) {
  const { minimum, recommended } = requirements;
  return (
    <div className={`grid gap-3 ${minimum.length && recommended.length ? "md:grid-cols-2" : ""}`}>
      {minimum.length > 0 && <Column title="Mínimos" items={minimum} />}
      {recommended.length > 0 && <Column title="Recomendados" items={recommended} />}
    </div>
  );
}
