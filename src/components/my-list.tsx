"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { formatCents } from "@/lib/format";
import { getExistingSubscription, getPushSupport } from "@/lib/push-client";
import { getStore, PLATFORM_FAMILIES, type PlatformFamilyId } from "@/lib/stores";
import { useWishlist } from "@/lib/wishlist";
import { buttonStyles, DiscountBadge } from "./ui";

interface GameRow {
  id: number;
  slug: string;
  title: string;
  coverUrl: string | null;
  bestCents: number | null;
  regularCents: number | null;
  discountPercent: number;
  bestStore: string | null;
}

interface AlertRow {
  kind: "target" | "sale";
  thresholdCents: number;
  platformFamily: PlatformFamilyId | null;
  /** Menor preço atual na plataforma do alerta. */
  bestCents: number | null;
  lastNotifiedAt: string | null;
  game: { id: number };
}

const familyLabel = (id: PlatformFamilyId) => PLATFORM_FAMILIES.find((f) => f.id === id)?.label ?? id;

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export function MyList() {
  const wishlist = useWishlist();
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Map<number, AlertRow>>(new Map());
  const [fetched, setFetched] = useState<{ key: string; games: GameRow[] } | null>(null);
  // depende do navegador: no servidor é sempre false
  const iosHint = useSyncExternalStore(
    () => () => {},
    () => getPushSupport() === "ios-needs-install",
    () => false,
  );

  // alertas deste aparelho (só existem se a pessoa já deu permissão de notificação)
  useEffect(() => {
    (async () => {
      const sub = await getExistingSubscription().catch(() => null);
      if (!sub) return;
      setEndpoint(sub.endpoint);
      const res = await fetch("/api/alertas/listar", { method: "POST", body: JSON.stringify({ endpoint: sub.endpoint }) });
      if (!res.ok) return;
      const { alerts } = (await res.json()) as { alerts: AlertRow[] };
      setAlerts(new Map(alerts.map((a) => [a.game.id, a])));
    })();
  }, []);

  // jogos com alerta entram na lista mesmo que tenham sido salvos em outro momento
  const ids = [...new Set([...wishlist.ids, ...alerts.keys()])];
  const key = ids.join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/jogos/resumo?ids=${key}`)
      .then((r) => r.json() as Promise<{ games: GameRow[] }>)
      .then((data) => !cancelled && setFetched({ key, games: data.games }))
      .catch(() => !cancelled && setFetched({ key, games: [] }));
    return () => {
      cancelled = true;
    };
  }, [key]);

  async function removeAlert(gameId: number) {
    if (!endpoint) return;
    await fetch("/api/alertas", { method: "DELETE", body: JSON.stringify({ endpoint, gameId }) });
    setAlerts((prev) => {
      const next = new Map(prev);
      next.delete(gameId);
      return next;
    });
  }

  async function removeGame(gameId: number) {
    if (alerts.has(gameId)) await removeAlert(gameId);
    wishlist.remove(gameId);
  }

  // enquanto busca uma lista nova, continua mostrando a anterior (sem piscar ao remover itens)
  const games = !key ? [] : (fetched?.games ?? null)?.filter((g) => ids.includes(g.id)) ?? null;
  if (games == null) {
    return <p className="text-sm text-text-2">Carregando sua lista…</p>;
  }

  if (!games.length) {
    return (
      <div className="rounded-card border border-dashed border-line p-10 text-center">
        <p className="font-display text-2xl font-bold uppercase">Sua lista está vazia</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-text-2">
          Na página de um jogo, toque em <strong className="text-text">Salvar na lista</strong> ou em{" "}
          <strong className="text-text">Avisar quando baixar</strong> para acompanhar o preço. A lista fica salva neste aparelho.
        </p>
        <Link href="/ofertas" className={`${buttonStyles.primarySm} mt-6`}>
          Ver ofertas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {iosHint && (
        <p className="rounded-card border border-line bg-surface px-4 py-3 text-sm text-text-2">
          No iPhone, para receber os alertas, adicione o site à tela de início (Compartilhar → Adicionar à Tela de Início) e abra por lá.
        </p>
      )}
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {games.map((g) => {
          const alert = alerts.get(g.id);
          return (
            <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-3 sm:flex-nowrap">
              <Link href={`/jogo/${g.slug}`} className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-[3px] bg-surface-2">
                {g.coverUrl && <Image src={g.coverUrl} alt="" fill sizes="56px" className="object-cover" />}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/jogo/${g.slug}`} className="block truncate font-medium hover:text-accent">
                  {g.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  {g.bestCents != null ? (
                    <>
                      {g.discountPercent > 0 && <DiscountBadge percent={g.discountPercent} size="sm" />}
                      <span className="tabular font-display text-lg font-bold">{g.bestCents === 0 ? "Grátis" : formatCents(g.bestCents)}</span>
                      {g.bestStore && <span className="text-xs text-muted">na {getStore(g.bestStore)?.name ?? g.bestStore}</span>}
                    </>
                  ) : (
                    <span className="text-muted">Sem preço no momento</span>
                  )}
                </p>
                <p className="mt-1 text-xs">
                  {alert ? (
                    <span className="text-accent">
                      Alerta{alert.platformFamily && ` no ${familyLabel(alert.platformFamily)}`}:{" "}
                      {alert.kind === "sale" ? "qualquer queda de preço" : `até ${formatCents(alert.thresholdCents)}`}
                      {alert.platformFamily && alert.bestCents != null && (
                        <span className="text-muted"> · agora {formatCents(alert.bestCents)}</span>
                      )}
                      {alert.lastNotifiedAt && <span className="text-muted"> · avisado em {dateFmt.format(new Date(alert.lastNotifiedAt))}</span>}
                    </span>
                  ) : (
                    <span className="text-muted">Sem alerta</span>
                  )}
                </p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                {alert ? (
                  <button type="button" onClick={() => removeAlert(g.id)} className={`${buttonStyles.secondary} flex-1 sm:flex-none`}>
                    Remover alerta
                  </button>
                ) : (
                  <Link href={`/jogo/${g.slug}`} className={`${buttonStyles.secondary} flex-1 sm:flex-none`}>
                    Criar alerta
                  </Link>
                )}
                <button type="button" onClick={() => removeGame(g.id)} className={`${buttonStyles.secondary} flex-1 sm:flex-none`}>
                  Tirar da lista
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
