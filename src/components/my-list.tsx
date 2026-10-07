"use client";

import { lightImage } from "@/lib/images";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { formatCents } from "@/lib/format";
import { getExistingSubscription, getPushSupport } from "@/lib/push-client";
import { getStore, PLATFORM_FAMILIES, type PlatformFamilyId } from "@/lib/stores";
import { useWishlist } from "@/lib/wishlist";
import { Icon, type IconName } from "./icon";
import { WishlistSkeleton } from "./skeletons";
import { PlatformIcon, StoreLogo } from "./store-logo";
import { buttonStyles, DiscountBadge, PriceText } from "./ui";

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

type Filter = "all" | "sale" | "alert";

const familyLabel = (id: PlatformFamilyId) => PLATFORM_FAMILIES.find((f) => f.id === id)?.label ?? id;

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

const action = `${buttonStyles.secondary} flex-1 sm:flex-none`;

export function MyList() {
  const wishlist = useWishlist();
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Map<number, AlertRow>>(new Map());
  const [fetched, setFetched] = useState<{ key: string; games: GameRow[] } | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
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
  if (games == null) return <WishlistSkeleton count={Math.min(ids.length, 5)} />;

  if (!games.length) {
    return (
      <div className="rounded-card border border-dashed border-line px-6 py-12 text-center">
        <span aria-hidden className="mx-auto flex size-14 items-center justify-center rounded-full border border-accent-line bg-accent-soft text-accent">
          <Icon name="heart" className="size-7" />
        </span>
        <p className="mt-5 font-display text-2xl font-bold uppercase">Sua wishlist está vazia</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-2">
          Na página de um jogo, toque em <strong className="font-medium text-text">Salvar na wishlist</strong> ou em{" "}
          <strong className="font-medium text-text">Me avisa quando dropar</strong> para acompanhar o preço. A wishlist fica salva neste aparelho.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/ofertas" className={buttonStyles.primarySm}>
            <Icon name="tag" className="size-4" />
            Ver ofertas
          </Link>
          <Link href="/busca" className={`${buttonStyles.secondary} px-4`}>
            <Icon name="compass" className="size-4" />
            Explorar jogos
          </Link>
        </div>
      </div>
    );
  }

  const counts: Record<Filter, number> = {
    all: games.length,
    sale: games.filter((g) => g.discountPercent > 0).length,
    alert: games.filter((g) => alerts.has(g.id)).length,
  };
  const options: { id: Filter; label: string; icon: IconName }[] = [
    { id: "all", label: "Todos", icon: "heart" },
    { id: "sale", label: "Em promoção", icon: "tag" },
    { id: "alert", label: "Com alerta", icon: "bell" },
  ];
  const active: Filter = counts[filter] ? filter : "all";
  const shown = games.filter((g) => (active === "sale" ? g.discountPercent > 0 : active === "alert" ? alerts.has(g.id) : true));

  return (
    <div className="space-y-4">
      {iosHint && (
        <p role="status" className="flex items-start gap-2.5 rounded-card border border-warn-line bg-warn-soft px-4 py-3 text-xs leading-snug text-text">
          <Icon name="alert" className="mt-px size-4 shrink-0 text-warn" />
          <span>No iPhone, para receber os alertas, adicione o site à tela de início (Compartilhar → Adicionar à Tela de Início) e abra por lá.</span>
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar a wishlist">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={active === o.id}
            onClick={() => setFilter(o.id)}
            className={`rounded-[4px] border px-3 py-1.5 font-display text-sm font-semibold uppercase tracking-wide transition ${
              active === o.id ? "border-accent bg-accent text-accent-ink" : "border-line text-text-2 hover:border-accent hover:text-accent"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon name={o.icon} className="size-4" />
              {o.label}
            </span>{" "}
            <span className={`tabular ${active === o.id ? "" : "text-muted"}`}>{counts[o.id]}</span>
          </button>
        ))}
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {shown.map((g) => {
          const alert = alerts.get(g.id);
          const store = g.bestStore ? (getStore(g.bestStore)?.name ?? g.bestStore) : null;
          return (
            <li key={g.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 p-3 sm:flex-nowrap sm:p-4">
              <Link href={`/jogo/${g.slug}`} className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-[3px] border border-line bg-surface-2">
                {g.coverUrl && <Image src={lightImage(g.coverUrl)} alt="" fill sizes="64px" className="object-cover" />}
              </Link>
              <div className="min-w-0 flex-1 space-y-1.5">
                <Link href={`/jogo/${g.slug}`} className="block truncate font-medium hover:text-accent">
                  {g.title}
                </Link>
                {g.bestCents != null ? (
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {g.discountPercent > 0 && <DiscountBadge percent={g.discountPercent} size="sm" />}
                    <PriceText cents={g.bestCents} className={`font-display text-xl font-bold leading-none ${g.discountPercent > 0 ? "text-accent" : ""}`} />
                    {g.discountPercent > 0 && g.regularCents ? <span className="tabular text-xs text-muted line-through">{formatCents(g.regularCents)}</span> : null}
                    {g.bestStore && store && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-text-2">
                        <StoreLogo store={g.bestStore} size={18} />
                        {store}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    <Icon name="alert" className="size-4" />
                    Sem preço no momento
                  </p>
                )}
                <p className="flex flex-wrap items-center gap-x-1.5 text-xs">
                  {alert ? (
                    <>
                      <Icon name="bell" className="size-3.5 shrink-0 text-accent" />
                      <span className="text-accent">
                        Alerta{alert.platformFamily && ` no ${familyLabel(alert.platformFamily)}`}:{" "}
                        {alert.kind === "sale" ? "qualquer queda de preço" : `até ${formatCents(alert.thresholdCents)}`}
                      </span>
                      {alert.platformFamily && alert.bestCents != null && <span className="text-muted">· agora {formatCents(alert.bestCents)}</span>}
                      {alert.lastNotifiedAt && <span className="text-muted">· avisado em {dateFmt.format(new Date(alert.lastNotifiedAt))}</span>}
                      {alert.platformFamily && <PlatformIcon family={alert.platformFamily} className="size-3.5 text-muted" />}
                    </>
                  ) : (
                    <>
                      <Icon name="bell" className="size-3.5 shrink-0 text-muted" />
                      <span className="text-muted">Sem alerta</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                {alert ? (
                  <button type="button" onClick={() => removeAlert(g.id)} className={action}>
                    <Icon name="cross" className="size-3.5" />
                    Remover alerta
                  </button>
                ) : (
                  <Link href={`/jogo/${g.slug}`} className={action}>
                    <Icon name="bell" className="size-3.5" />
                    Criar alerta
                  </Link>
                )}
                <button type="button" onClick={() => removeGame(g.id)} className={action}>
                  <Icon name="trash" className="size-3.5" />
                  Tirar da wishlist
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
