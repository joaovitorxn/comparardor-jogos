"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { formatCents } from "@/lib/format";
import { lightImage } from "@/lib/images";
import { getStore } from "@/lib/stores";
import { Icon } from "./icon";
import { StoreLogo } from "./store-logo";
import { buttonStyles, DiscountBadge, PriceText } from "./ui";

/** Só o que o destaque usa (o jogo inteiro é pesado demais para enviar ao navegador). */
export interface ShowcaseItem {
  slug: string;
  title: string;
  headerUrl: string | null;
  backgroundUrl: string | null;
  /** Arte de fundo com o lado direito claro e liso: fica alinhada à esquerda e some em degradê para o fundo escuro. */
  lightHero: boolean;
  bestPriceCents: number | null;
  regularPriceCents: number | null;
  maxDiscount: number;
  bestStore: string | null;
}

const ROTATE_MS = 6500;
// arte com o desenho de um lado e um degradê branco do outro (library hero da Steam): alinha o desenho à esquerda e apaga a
// parte clara em degradê, sem trocar a imagem
const FADE_RIGHT = "object-left [mask-image:linear-gradient(to_right,#000_52%,transparent_92%)] [-webkit-mask-image:linear-gradient(to_right,#000_52%,transparent_92%)]";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * Banner grande que troca de jogo sozinho (a barra de progresso embaixo dele marca o tempo e,
 * ao terminar, chama o próximo), com a lista "Drops em destaque" ao lado. Pausa quando o
 * mouse ou o foco está em cima, e passar o mouse em um item da lista mostra aquele jogo.
 */
export function FeaturedShowcase({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => false);

  // carrega a arte do próximo jogo antes da troca, para o banner não aparecer vazio
  useEffect(() => {
    const next = items[(active + 1) % items.length];
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const url = wide ? (next.backgroundUrl ?? next.headerUrl) : (next.headerUrl ?? next.backgroundUrl);
    if (url) new window.Image().src = lightImage(url);
  }, [active, items]);

  const deal = items[active];
  const pause = { onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false), onFocus: () => setPaused(true), onBlur: () => setPaused(false) };

  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" aria-roledescription="carrossel">
      <div className="relative flex flex-col" {...pause}>
        <Link
          href={`/jogo/${deal.slug}`}
          className="group relative flex flex-1 flex-col overflow-hidden rounded-card border border-line bg-surface lg:min-h-[26rem] lg:flex-row"
        >
          {/* celular: a capa em formato banner (460x215) em cima, inteira, e o texto embaixo; no desktop, o texto por cima da arte larga */}
          <div key={deal.slug} className="relative aspect-[460/215] animate-[showcase-in_500ms_ease-out] overflow-hidden lg:absolute lg:inset-0 lg:aspect-auto">
            {(deal.headerUrl ?? deal.backgroundUrl) && (
              <Image src={lightImage(deal.headerUrl ?? deal.backgroundUrl)!} alt="" fill priority={active === 0} sizes="(min-width: 1024px) 0px, 100vw" className="object-cover lg:hidden" />
            )}
            {(deal.backgroundUrl ?? deal.headerUrl) && (
              <Image
                src={lightImage(deal.backgroundUrl ?? deal.headerUrl)!}
                alt=""
                fill
                sizes="(min-width: 1024px) 66vw, 0px"
                className={`hidden object-cover transition duration-700 group-hover:scale-[1.02] lg:block ${deal.lightHero ? FADE_RIGHT : ""}`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent lg:bg-gradient-to-r lg:from-bg lg:via-bg/75 lg:to-transparent" />
          </div>

          <div key={`${deal.slug}-info`} className="relative -mt-8 flex min-h-[15rem] max-w-lg animate-[showcase-in_500ms_ease-out] flex-col justify-end gap-4 p-5 pt-0 sm:p-6 sm:pt-0 lg:mt-auto lg:min-h-0 lg:p-10">
            <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight lg:text-5xl">{deal.title}</h1>
            {deal.bestPriceCents != null && (
              <div className="flex flex-wrap items-center gap-3">
                {deal.maxDiscount > 0 && <DiscountBadge percent={deal.maxDiscount} size="lg" />}
                <PriceText cents={deal.bestPriceCents} className="font-display text-4xl font-bold" />
                {deal.regularPriceCents != null && deal.regularPriceCents > deal.bestPriceCents && (
                  <span className="tabular text-sm text-muted line-through">{formatCents(deal.regularPriceCents)}</span>
                )}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <span className={buttonStyles.primary}>Comparar preços</span>
              {deal.bestStore && (
                <span className="flex items-center gap-2 text-sm text-text-2">
                  <StoreLogo store={deal.bestStore} size={24} />
                  na {getStore(deal.bestStore)?.name}
                </span>
              )}
            </div>
          </div>
        </Link>

        {items.length > 1 && !reduceMotion && (
          // a animação é o relógio: quando a barra enche, passa para o próximo jogo; pausar congela a barra
          <div className="pointer-events-none absolute inset-x-px bottom-px h-1 overflow-hidden rounded-b-card">
            <div
              key={active}
              className="h-full origin-left bg-accent"
              style={{ animation: `showcase-progress ${ROTATE_MS}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }}
              onAnimationEnd={() => setActive((i) => (i + 1) % items.length)}
            />
          </div>
        )}

        {items.length > 1 && (
          <div className="absolute right-3 top-3 flex gap-1.5 rounded-full bg-bg/70 px-2 py-1.5 backdrop-blur-sm" role="group" aria-label="Escolher destaque">
            {items.map((item, i) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver ${item.title}`}
                aria-current={i === active}
                className={`h-2 rounded-full transition-all ${i === active ? "w-5 bg-accent" : "w-2 bg-text-2/50 hover:bg-text-2"}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col rounded-card border border-line bg-surface" {...pause}>
        <h2 className="flex items-center gap-2 border-b border-accent-line bg-accent-soft px-4 py-3 font-display text-lg font-bold uppercase tracking-wider text-text">
          <Icon name="bolt" className="size-5 text-accent" />
          Drops em destaque
        </h2>
        <ol className="flex flex-1 flex-col">
          {items.map((d, i) => (
            <li key={d.slug} className="border-b border-line last:border-b-0">
              <Link
                href={`/jogo/${d.slug}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                aria-current={i === active ? "true" : undefined}
                className={`group relative flex items-center gap-3 px-4 py-3 transition ${i === active ? "bg-surface-2" : "hover:bg-surface-2"}`}
              >
                {i === active && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-accent" />}
                <span className={`tabular w-4 font-display text-lg font-bold ${i === active ? "text-accent" : "text-muted"}`}>{i + 1}</span>
                <span className="relative h-11 w-[5.5rem] shrink-0 overflow-hidden rounded-[3px] bg-surface-2">
                  {d.headerUrl && <Image src={d.headerUrl} alt="" fill sizes="88px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-medium group-hover:text-accent ${i === active ? "text-accent" : ""}`}>{d.title}</span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <DiscountBadge percent={d.maxDiscount} size="sm" />
                    {d.bestPriceCents != null && <PriceText cents={d.bestPriceCents} className="text-sm font-semibold" />}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
