"use client";

import { useEffect, useRef, useState } from "react";
import type { PriceSeries } from "@/db/queries";
import { formatCents } from "@/lib/format";
import { getStore } from "@/lib/stores";

const RANGES = [
  { id: "3m", label: "3M", days: 90 },
  { id: "1a", label: "1A", days: 365 },
  { id: "2a", label: "2A", days: 730 },
  { id: "tudo", label: "Tudo", days: Infinity },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

const HEIGHT = 280;
const M = { top: 20, right: 16, bottom: 28, left: 64 };
const DAY = 86_400_000;

const seriesColor = (store: string) => `var(--series-${store}, var(--text-2))`;
// a Microsoft Store (PC) divide a cor com a Xbox (mesma empresa); o tracejado a diferencia
const seriesDash = (store: string) => (store === "msstore" ? "5 3" : undefined);

/** Amostra da série na legenda/tooltip — tracejada quando a linha é tracejada. */
function SeriesKey({ store, muted = false }: { store: string; muted?: boolean }) {
  const color = muted ? "var(--line-strong)" : seriesColor(store);
  const background = seriesDash(store) ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 6px)` : color;
  return <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full" style={{ background }} />;
}
const storeName = (store: string) => getStore(store)?.name ?? store;
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

type Point = [number, number];

/** Índice do último ponto em ou antes de `t` (o preço vigente — linhas em degrau). */
function indexAt(points: Point[], t: number): number {
  let lo = 0;
  let hi = points.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid][0] <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

function valueAt(points: Point[], t: number): number | null {
  const i = indexAt(points, t);
  return i >= 0 ? points[i][1] : null;
}

/**
 * Menor preço entre as lojas em cada instante — a pergunta principal do gráfico.
 * Guarda também qual loja tinha esse preço, para o tooltip.
 */
function lowerEnvelope(series: PriceSeries[]): { points: Point[]; stores: string[] } {
  const times = [...new Set(series.flatMap((s) => s.points.map((p) => p[0])))].sort((a, b) => a - b);
  const points: Point[] = [];
  const stores: string[] = [];
  for (const t of times) {
    let best: { cents: number; store: string } | null = null;
    for (const s of series) {
      const v = valueAt(s.points, t);
      if (v != null && (!best || v < best.cents)) best = { cents: v, store: s.store };
    }
    if (best && points.at(-1)?.[1] !== best.cents) {
      points.push([t, best.cents]);
      stores.push(best.store);
    }
  }
  return { points, stores };
}

/** Recorta ao período, começando pelo preço vigente no início. */
function clip(points: Point[], start: number, now: number): Point[] {
  const startValue = valueAt(points, start);
  const inside = points.filter(([t]) => t > start && t <= now);
  return startValue != null ? [[start, startValue], ...inside] : inside;
}

/** Passo "redondo" para o eixo Y: 1, 2, 2,5 ou 5 × 10ⁿ. */
function niceStep(maxCents: number, ticks = 4) {
  const raw = maxCents / ticks;
  const pow = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
}

function monthTicks(start: number, end: number, width: number) {
  const months = (end - start) / (30 * DAY);
  const every = [1, 2, 3, 6, 12, 24].find((n) => (months / n) * 70 <= width) ?? 24;
  const ticks: number[] = [];
  const d = new Date(start);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + 1);
  while (d.getTime() < end) {
    if (d.getMonth() % every === 0 || every === 1) ticks.push(d.getTime());
    d.setMonth(d.getMonth() + 1);
  }
  return ticks;
}

export function PriceHistoryChart({ series, now }: { series: PriceSeries[]; now: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [range, setRange] = useState<RangeId>("1a");
  // lojas individuais começam desligadas: com várias lojas e promoções frequentes, as linhas viram ruído
  const [shown, setShown] = useState<Set<string>>(new Set());
  const [hoverT, setHoverT] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const withData = series.filter((s) => s.points.length > 0);
  if (!withData.length) {
    return <p className="rounded-card border border-line bg-surface p-6 text-sm text-text-2">Ainda não há histórico de preços para este jogo.</p>;
  }

  // consoles: não há histórico antigo, só o que registramos desde que o jogo entrou no catálogo
  const tracked = withData.filter((s) => s.trackedSince != null);
  const firstPoint = Math.min(...withData.map((s) => s.points[0][0]));
  const rangeDays = RANGES.find((r) => r.id === range)!.days;
  const start = rangeDays === Infinity ? firstPoint : Math.max(firstPoint, now - rangeDays * DAY);

  const envelope = lowerEnvelope(withData);
  const best = clip(envelope.points, start, now);
  const stores = withData.filter((s) => shown.has(s.store)).map((s) => ({ store: s.store, points: clip(s.points, start, now) }));

  const plotW = Math.max(0, width - M.left - M.right);
  const plotH = HEIGHT - M.top - M.bottom;
  const max = Math.max(1, ...best.map((p) => p[1]), ...stores.flatMap((s) => s.points.map((p) => p[1])));
  const step = niceStep(max);
  const yMax = Math.ceil(max / step) * step;

  const x = (t: number) => M.left + ((t - start) / Math.max(1, now - start)) * plotW;
  const y = (cents: number) => M.top + plotH - (cents / yMax) * plotH;

  const linePath = (pts: Point[]) => {
    if (!pts.length) return "";
    let d = `M${x(pts[0][0]).toFixed(1)},${y(pts[0][1]).toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) d += `H${x(pts[i][0]).toFixed(1)}V${y(pts[i][1]).toFixed(1)}`;
    return d + `H${x(now).toFixed(1)}`;
  };
  const areaPath = (pts: Point[]) =>
    pts.length ? `${linePath(pts)}V${y(0).toFixed(1)}H${x(pts[0][0]).toFixed(1)}Z` : "";

  // rótulo seletivo: só o menor preço do período (ignorando R$ 0 de brindes, ex.: jogo grátis na Epic)
  let low: { t: number; cents: number } | null = null;
  for (const [t, cents] of best) if (cents > 0 && (!low || cents < low.cents)) low = { t, cents };

  const yTicks: number[] = [];
  for (let v = 0; v <= yMax + 1; v += step) yTicks.push(v);
  const xTicks = monthTicks(start, now, plotW);
  const monthFmt = new Intl.DateTimeFormat("pt-BR", now - start > 400 * DAY ? { month: "short", year: "2-digit" } : { month: "short" });

  const hover =
    hoverT != null
      ? (() => {
          const i = indexAt(envelope.points, hoverT);
          return {
            best: i >= 0 ? { cents: envelope.points[i][1], store: envelope.stores[i] } : null,
            stores: stores
              .map((s) => ({ store: s.store, cents: valueAt(s.points, hoverT) }))
              .filter((r): r is { store: string; cents: number } => r.cents != null)
              .sort((a, b) => a.cents - b.cents),
          };
        })()
      : null;
  const tooltipLeft = hoverT != null ? x(hoverT) : 0;
  const flip = tooltipLeft > width - 230;

  function onPointer(e: React.PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverT(start + ratio * (now - start));
  }

  function toggle(store: string) {
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(store)) next.delete(store);
      else next.add(store);
      return next;
    });
  }

  // resumo por loja no período — também é a versão acessível do gráfico
  const summary = withData.map((s) => {
    const pts = clip(s.points, start, now);
    const priced = pts.filter((p) => p[1] > 0);
    const minPoint = priced.reduce<Point | null>((acc, p) => (!acc || p[1] < acc[1] ? p : acc), null);
    return {
      store: s.store,
      current: pts.at(-1)?.[1] ?? null,
      min: minPoint,
      max: pts.length ? Math.max(...pts.map((p) => p[1])) : null,
    };
  });

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      {/* filtros numa linha só, acima do gráfico */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Séries do gráfico">
          <span className="flex items-center gap-2 rounded-[3px] border border-accent-line bg-accent-soft px-2 py-1 text-xs font-medium text-text">
            <span aria-hidden className="h-0.5 w-3 rounded-full bg-accent" />
            Menor preço entre as lojas
          </span>
          {withData.map((s) => {
            const on = shown.has(s.store);
            return (
              <button
                key={s.store}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(s.store)}
                className={`flex items-center gap-2 rounded-[3px] border px-2 py-1 text-xs transition ${
                  on ? "border-line-strong bg-surface-2 text-text" : "border-line text-muted hover:border-line-strong hover:text-text-2"
                }`}
              >
                <SeriesKey store={s.store} muted={!on} />
                {storeName(s.store)}
              </button>
            );
          })}
        </div>
        <div className="flex shrink-0 rounded-[4px] border border-line bg-bg p-0.5" role="group" aria-label="Período">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={range === r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-[3px] px-2.5 py-1 font-display text-sm font-semibold uppercase tracking-wide transition ${
                range === r.id ? "bg-surface-3 text-text" : "text-muted hover:text-text"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={wrapRef} className="relative" style={{ height: HEIGHT }}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} role="img" aria-label="Histórico do menor preço entre as lojas">
            {yTicks.map((v) => (
              <g key={v}>
                <line x1={M.left} x2={width - M.right} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
                <text x={M.left - 10} y={y(v)} dy="0.32em" textAnchor="end" className="tabular fill-[var(--muted)] text-[11px]">
                  {formatCents(v).replace(",00", "")}
                </text>
              </g>
            ))}
            {xTicks.map((t) => (
              <text key={t} x={x(t)} y={HEIGHT - 8} textAnchor="middle" className="fill-[var(--muted)] text-[11px]">
                {monthFmt.format(t).replace(".", "")}
              </text>
            ))}

            {stores.map((s) => (
              <path
                key={s.store}
                d={linePath(s.points)}
                fill="none"
                stroke={seriesColor(s.store)}
                strokeDasharray={seriesDash(s.store)}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            <path d={areaPath(best)} fill="var(--accent)" fillOpacity={0.1} />
            <path d={linePath(best)} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {low && hoverT == null && (
              <g>
                <circle cx={x(low.t)} cy={y(low.cents)} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
                <text
                  x={Math.min(Math.max(x(low.t), M.left + 56), width - M.right - 56)}
                  y={Math.max(y(low.cents) - 12, 12)}
                  textAnchor="middle"
                  // contorno na cor da superfície separa o rótulo da linha que ele cruza
                  paintOrder="stroke"
                  stroke="var(--surface)"
                  strokeWidth={4}
                  strokeLinejoin="round"
                  className="tabular fill-[var(--text)] text-[11px] font-semibold"
                >
                  Menor: {formatCents(low.cents)}
                </text>
              </g>
            )}

            {hoverT != null && hover && (
              <g pointerEvents="none">
                <line x1={x(hoverT)} x2={x(hoverT)} y1={M.top} y2={M.top + plotH} stroke="var(--line-strong)" strokeWidth={1} />
                {hover.stores.map((r) => (
                  <circle key={r.store} cx={x(hoverT)} cy={y(r.cents)} r={4} fill={seriesColor(r.store)} stroke="var(--surface)" strokeWidth={2} />
                ))}
                {hover.best && <circle cx={x(hoverT)} cy={y(hover.best.cents)} r={4} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />}
              </g>
            )}

            <rect
              x={M.left}
              y={M.top}
              width={plotW}
              height={plotH}
              fill="transparent"
              onPointerMove={onPointer}
              onPointerDown={onPointer}
              onPointerLeave={() => setHoverT(null)}
              style={{ touchAction: "pan-y" }}
            />
          </svg>
        )}

        {hoverT != null && hover?.best && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-56 rounded-[4px] border border-line-strong bg-surface-2 p-2.5 text-xs shadow-xl shadow-black/40"
            style={flip ? { right: width - tooltipLeft + 12 } : { left: tooltipLeft + 12 }}
          >
            <p className="mb-1.5 font-medium text-text-2">{dateFmt.format(hoverT)}</p>
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-0.5 w-3 shrink-0 rounded-full bg-accent" />
              <span className="flex-1 truncate text-text-2">Menor · {storeName(hover.best.store)}</span>
              <span className="tabular font-semibold text-text">{formatCents(hover.best.cents)}</span>
            </div>
            {hover.stores.length > 0 && (
              <ul className="mt-1.5 space-y-1 border-t border-line pt-1.5">
                {hover.stores.map((r) => (
                  <li key={r.store} className="flex items-center gap-2">
                    <SeriesKey store={r.store} />
                    <span className="flex-1 truncate text-text-2">{storeName(r.store)}</span>
                    <span className="tabular text-text">{formatCents(r.cents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {tracked.length > 0 && (
        <p className="mt-3 rounded-[4px] border border-line bg-surface-2 px-3 py-2 text-xs leading-relaxed text-text-2">
          {tracked.map((s, i) => (
            <span key={s.store}>
              {i > 0 && (i === tracked.length - 1 ? " e " : ", ")}
              <span className="font-medium text-text">{storeName(s.store)}</span>
            </span>
          ))}{" "}
          {tracked.length > 1 ? "não divulgam" : "não divulga"} preços antigos: o histórico {tracked.length > 1 ? "delas" : "dela"} é registrado pelo Dropou
          {` desde ${dateFmt.format(Math.min(...tracked.map((s) => s.trackedSince!)))}`} e vai ficando mais completo com o tempo.
        </p>
      )}

      <details className="mt-3 border-t border-line pt-3 text-sm">
        <summary className="cursor-pointer text-xs text-muted hover:text-text">Ver resumo por loja</summary>
        <div className="overflow-x-auto">
          <table className="mt-3 w-full min-w-[28rem] text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="py-1 font-medium">Loja</th>
                <th className="py-1 text-right font-medium">Atual</th>
                <th className="py-1 text-right font-medium">Menor no período</th>
                <th className="py-1 text-right font-medium">Maior</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.store} className="border-t border-line">
                  <td className="py-1.5">{storeName(s.store)}</td>
                  <td className="tabular py-1.5 text-right">{s.current != null ? formatCents(s.current) : "—"}</td>
                  <td className="tabular py-1.5 text-right">
                    {s.min ? (
                      <>
                        {formatCents(s.min[1])} <span className="text-muted">({dateFmt.format(s.min[0])})</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="tabular py-1.5 text-right">{s.max != null ? formatCents(s.max) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
