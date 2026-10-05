"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatCents } from "@/lib/format";
import type { FamilyKey } from "@/lib/best-by-family";
import { usePlatformPref } from "@/lib/platform-pref";
import { getExistingSubscription, getPushSupport, parseBrl, PushPermissionError, subscribeToPush } from "@/lib/push-client";
import { PLATFORM_FAMILIES, type PlatformFamilyId } from "@/lib/stores";
import { useWishlist } from "@/lib/wishlist";
import { buttonStyles } from "./ui";

interface Props {
  gameId: number;
  gameTitle: string;
  /** Menor preço atual por plataforma ("all" = qualquer uma). */
  prices: Partial<Record<FamilyKey, number>>;
  /** Menor preço já registrado por plataforma. */
  lows: Partial<Record<FamilyKey, number>>;
}

interface ExistingAlert {
  kind: "target" | "sale";
  thresholdCents: number;
  platformFamily: PlatformFamilyId | null;
}

const FAMILY_LABEL: Record<FamilyKey, string> = {
  all: "Qualquer plataforma",
  ...(Object.fromEntries(PLATFORM_FAMILIES.map((f) => [f.id, f.label])) as Record<PlatformFamilyId, string>),
};

type Status =
  | { type: "idle" }
  | { type: "saving" }
  | { type: "saved"; alert: ExistingAlert }
  | { type: "removed" }
  | { type: "error"; message: string }
  | { type: "denied" }
  | { type: "ios" }
  | { type: "unsupported" };

function BellIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

/** Sugestão de alvo: o menor preço histórico, se for menor que o atual; senão 25% abaixo. */
function suggestTarget(current: number, low: number | null) {
  if (low != null && low > 0 && low < current) return low;
  return Math.max(1, Math.floor((current * 0.75) / 100) * 100 - 1); // ex.: R$ 34,99
}

export function AlertButton({ gameId, gameTitle, prices, lows }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const wishlist = useWishlist();
  const [pref] = usePlatformPref();
  const [existing, setExisting] = useState<ExistingAlert | null>(null);
  const [kind, setKind] = useState<"target" | "sale">("target");
  // plataforma escolhida no diálogo; até a pessoa escolher, segue a do filtro da tabela
  const [chosenFamily, setChosenFamily] = useState<FamilyKey | null>(null);
  const [target, setTarget] = useState("");
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const families = (["all", ...PLATFORM_FAMILIES.map((f) => f.id)] as FamilyKey[]).filter((k) => prices[k] != null);
  const family: FamilyKey = chosenFamily ?? (pref !== "todas" && prices[pref] != null ? pref : "all");
  const currentCents = prices[family] ?? prices.all ?? 0;
  const historicLowCents = lows[family] ?? null;
  const suggestionFor = (k: FamilyKey) => formatCents(suggestTarget(prices[k] ?? currentCents, lows[k] ?? null));

  function chooseFamily(k: FamilyKey) {
    setChosenFamily(k);
    setTarget(suggestionFor(k));
    if (status.type === "error") setStatus({ type: "idle" });
  }

  // se este aparelho já tem alerta para o jogo, o botão mostra isso
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sub = await getExistingSubscription().catch(() => null);
      if (!sub) return;
      const res = await fetch("/api/alertas/listar", { method: "POST", body: JSON.stringify({ endpoint: sub.endpoint }) });
      if (!res.ok || cancelled) return;
      const { alerts } = (await res.json()) as { alerts: ({ game: { id: number } } & ExistingAlert)[] };
      const mine = alerts.find((a) => a.game.id === gameId);
      if (mine) setExisting({ kind: mine.kind, thresholdCents: mine.thresholdCents, platformFamily: mine.platformFamily });
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  function open() {
    const support = getPushSupport();
    setStatus(support === "ios-needs-install" ? { type: "ios" } : support === "unsupported" ? { type: "unsupported" } : { type: "idle" });
    if (existing) {
      const k = existing.platformFamily ?? "all";
      setKind(existing.kind);
      setChosenFamily(k);
      setTarget(existing.kind === "target" ? formatCents(existing.thresholdCents) : suggestionFor(k));
    } else {
      setTarget(suggestionFor(family));
    }
    dialogRef.current?.showModal();
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const targetCents = kind === "target" ? parseBrl(target) : undefined;
    if (kind === "target") {
      if (targetCents == null) return setStatus({ type: "error", message: "Digite um preço, por exemplo 49,90." });
      if (targetCents >= currentCents) return setStatus({ type: "error", message: `O alvo precisa ser menor que o preço atual (${formatCents(currentCents)}).` });
    }
    setStatus({ type: "saving" });
    try {
      const subscription = await subscribeToPush();
      const res = await fetch("/api/alertas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON(), gameId, kind, targetCents, platformFamily: family === "all" ? null : family }),
      });
      const data = (await res.json()) as Partial<ExistingAlert> & { error?: string };
      if (!res.ok) return setStatus({ type: "error", message: data.error ?? "Não foi possível criar o alerta." });
      const alert = { kind: data.kind!, thresholdCents: data.thresholdCents!, platformFamily: data.platformFamily ?? null };
      setExisting(alert);
      wishlist.add(gameId);
      setStatus({ type: "saved", alert });
    } catch (err) {
      setStatus(err instanceof PushPermissionError ? { type: "denied" } : { type: "error", message: "Não foi possível ativar as notificações neste navegador." });
    }
  }

  async function remove() {
    setStatus({ type: "saving" });
    const sub = await getExistingSubscription().catch(() => null);
    if (sub) await fetch("/api/alertas", { method: "DELETE", body: JSON.stringify({ endpoint: sub.endpoint, gameId }) });
    setExisting(null);
    setStatus({ type: "removed" });
  }

  const where = (a: ExistingAlert) => (a.platformFamily ? ` no ${FAMILY_LABEL[a.platformFamily]}` : "");
  const describe = (a: ExistingAlert) =>
    a.kind === "sale" ? `em qualquer queda de preço${where(a)}` : `quando chegar a ${formatCents(a.thresholdCents)}${where(a)}`;
  const quick = [
    historicLowCents != null && historicLowCents > 0 && historicLowCents < currentCents ? { label: "Menor histórico", cents: historicLowCents } : null,
    { label: "-25%", cents: Math.round(currentCents * 0.75) },
    { label: "-50%", cents: Math.round(currentCents * 0.5) },
  ].filter((q): q is { label: string; cents: number } => q != null && q.cents > 0);

  return (
    <>
      <button type="button" onClick={open} className={`${buttonStyles.secondary} w-full py-2.5 text-sm`}>
        <BellIcon className={existing ? "size-4 text-accent" : "size-4"} />
        {existing
          ? `Alerta ativo${existing.platformFamily ? ` (${FAMILY_LABEL[existing.platformFamily]})` : ""}: ${existing.kind === "sale" ? "qualquer queda" : formatCents(existing.thresholdCents)}`
          : "Avisar quando baixar"}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="alert-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-card border border-line-strong bg-surface p-0 text-text shadow-2xl backdrop:bg-black/70"
        onClick={(e) => e.target === dialogRef.current && dialogRef.current?.close()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id="alert-title" className="flex items-center gap-2 font-display text-xl font-bold uppercase tracking-wide">
              <BellIcon className="size-5 text-accent" /> Alerta de preço
            </h2>
            <p className="mt-0.5 text-sm text-text-2">{gameTitle}</p>
          </div>
          <button type="button" aria-label="Fechar" onClick={() => dialogRef.current?.close()} className="-mr-1 rounded p-1 text-xl leading-none text-muted hover:text-text">
            ×
          </button>
        </div>

        {status.type === "saved" ? (
          <div className="space-y-4 px-5 py-5">
            <p className="text-sm">
              <span className="font-semibold text-accent">Alerta criado.</span> Você vai receber uma notificação neste aparelho {describe(status.alert)}.
            </p>
            <p className="text-xs text-muted">O jogo também foi salvo na sua lista. Os preços são verificados de hora em hora.</p>
            <div className="flex gap-2">
              <Link href="/minha-lista" className={`${buttonStyles.secondary} flex-1 py-2`}>
                Ver minha lista
              </Link>
              <button type="button" onClick={() => dialogRef.current?.close()} className={`${buttonStyles.primarySm} flex-1 py-2`}>
                Pronto
              </button>
            </div>
          </div>
        ) : status.type === "ios" ? (
          <div className="space-y-3 px-5 py-5 text-sm text-text-2">
            <p className="text-text">No iPhone, as notificações só funcionam com o site instalado:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Toque em <strong className="text-text">Compartilhar</strong> (o quadrado com a seta) no Safari.
              </li>
              <li>
                Escolha <strong className="text-text">Adicionar à Tela de Início</strong>.
              </li>
              <li>Abra o site pelo novo ícone e crie o alerta de novo.</li>
            </ol>
          </div>
        ) : status.type === "unsupported" ? (
          <p className="px-5 py-5 text-sm text-text-2">Este navegador não aceita notificações. Tente pelo Chrome, Edge, Firefox ou Safari atualizados.</p>
        ) : (
          <form onSubmit={save} className="space-y-4 px-5 py-5">
            {families.length > 2 && (
              <fieldset>
                <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">Plataforma</legend>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {families.map((k) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={family === k}
                      onClick={() => chooseFamily(k)}
                      className={`rounded-[4px] border px-2.5 py-1.5 text-left transition ${
                        family === k ? "border-accent bg-accent-soft" : "border-line hover:border-line-strong"
                      }`}
                    >
                      <span className="block text-xs text-text-2">{k === "all" ? "Qualquer uma" : FAMILY_LABEL[k]}</span>
                      <span className="tabular block text-sm font-semibold">{formatCents(prices[k]!)}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <p className="text-sm text-text-2">
              Menor preço agora{family !== "all" && ` no ${FAMILY_LABEL[family]}`}:{" "}
              <span className="tabular font-semibold text-text">{formatCents(currentCents)}</span>
            </p>

            <fieldset className="space-y-3">
              <legend className="sr-only">Quando avisar</legend>
              <label className={`block rounded-[4px] border p-3 ${kind === "target" ? "border-accent-line bg-accent-soft" : "border-line"}`}>
                <span className="flex items-center gap-2 text-sm font-medium">
                  <input type="radio" name="kind" checked={kind === "target"} onChange={() => setKind("target")} className="accent-[var(--accent)]" />
                  Quando chegar a
                </span>
                <span className="mt-2 flex items-center gap-2 pl-6">
                  <input
                    inputMode="decimal"
                    value={target}
                    onFocus={() => setKind("target")}
                    onChange={(e) => {
                      setTarget(e.target.value);
                      if (status.type === "error") setStatus({ type: "idle" });
                    }}
                    aria-label="Preço-alvo em reais"
                    className="tabular h-9 w-32 rounded-[4px] border border-line bg-bg px-2.5 text-sm focus:border-accent focus:outline-none"
                  />
                  <span className="text-xs text-muted">ou menos</span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1.5 pl-6">
                  {quick.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => {
                        setKind("target");
                        setTarget(formatCents(q.cents));
                      }}
                      className="rounded-[3px] border border-line px-2 py-0.5 text-xs text-text-2 hover:border-accent hover:text-accent"
                    >
                      {q.label}: <span className="tabular">{formatCents(q.cents)}</span>
                    </button>
                  ))}
                </span>
              </label>
              <label className={`flex items-center gap-2 rounded-[4px] border p-3 text-sm font-medium ${kind === "sale" ? "border-accent-line bg-accent-soft" : "border-line"}`}>
                <input type="radio" name="kind" checked={kind === "sale"} onChange={() => setKind("sale")} className="accent-[var(--accent)]" />
                Em qualquer queda de preço
              </label>
            </fieldset>

            {status.type === "error" && (
              <p role="alert" className="text-sm text-danger">
                {status.message}
              </p>
            )}
            {status.type === "denied" && (
              <p role="alert" className="text-sm text-danger">
                As notificações estão bloqueadas para este site. Libere nas configurações do navegador (ícone de cadeado ao lado do endereço) e tente de novo.
              </p>
            )}
            {status.type === "removed" && <p className="text-sm text-text-2">Alerta removido.</p>}

            <div className="flex gap-2">
              {existing && (
                <button type="button" onClick={remove} disabled={status.type === "saving"} className={`${buttonStyles.secondary} py-2`}>
                  Remover alerta
                </button>
              )}
              <button type="submit" disabled={status.type === "saving"} className={`${buttonStyles.primarySm} flex-1 py-2 disabled:opacity-60`}>
                {status.type === "saving" ? "Ativando…" : existing ? "Atualizar alerta" : "Criar alerta"}
              </button>
            </div>
            <p className="text-xs text-muted">O navegador vai pedir permissão para mostrar notificações. Sem cadastro: o alerta fica ligado a este aparelho.</p>
          </form>
        )}
      </dialog>
    </>
  );
}
