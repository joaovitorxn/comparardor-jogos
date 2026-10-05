import Image from "next/image";
import Link from "next/link";
import { GameGrid } from "@/components/game-card";
import { StoreLogo } from "@/components/store-logo";
import { buttonStyles, DiscountBadge, PriceText, SectionHeader } from "@/components/ui";
import { getDeals, getDealPool, pickFeaturedDeals, pickPreorderDeals, type GameSummary } from "@/db/queries";
import { BRAND } from "@/lib/brand";
import { formatCents } from "@/lib/format";
import { getStore, STORES } from "@/lib/stores";

export const revalidate = 300;

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="font-medium text-text-2 transition hover:text-accent">
      {label} →
    </Link>
  );
}

function Featured({ deal }: { deal: GameSummary }) {
  const { game } = deal;
  return (
    <Link
      href={`/jogo/${game.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface lg:min-h-[26rem] lg:flex-row"
    >
      {/* celular: a capa em formato de banner (460x215) em cima, inteira, e o texto embaixo; no desktop, o texto por cima da arte larga */}
      <div className="relative aspect-[460/215] overflow-hidden lg:absolute lg:inset-0 lg:aspect-auto">
        {(game.headerUrl ?? game.backgroundUrl) && (
          <Image
            src={(game.headerUrl ?? game.backgroundUrl)!}
            alt=""
            fill
            sizes="(min-width: 1024px) 0px, 100vw"
            className="object-cover lg:hidden"
          />
        )}
        {(game.backgroundUrl ?? game.headerUrl) && (
          <Image
            src={(game.backgroundUrl ?? game.headerUrl)!}
            alt=""
            fill
            sizes="(min-width: 1024px) 66vw, 0px"
            className="hidden object-cover transition duration-700 group-hover:scale-[1.02] lg:block"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent lg:bg-gradient-to-r lg:from-bg lg:via-bg/75 lg:to-transparent" />
      </div>

      <div className="relative -mt-8 flex max-w-lg flex-col gap-4 p-5 pt-0 sm:p-6 sm:pt-0 lg:my-auto lg:mt-0 lg:p-10">
        <span className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-accent">Drop em destaque</span>
        <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight lg:text-5xl">{game.title}</h1>
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
  );
}

function TopDeals({ deals }: { deals: GameSummary[] }) {
  return (
    <div className="flex flex-col rounded-card border border-line bg-surface">
      <h2 className="border-b border-line px-4 py-3 font-display text-base font-semibold uppercase tracking-wider text-text-2">
        Mais drops
      </h2>
      <ol className="flex flex-1 flex-col">
        {deals.map((d, i) => (
          <li key={d.game.id} className="border-b border-line last:border-b-0">
            <Link href={`/jogo/${d.game.slug}`} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-surface-2">
              <span className="tabular w-4 font-display text-lg font-bold text-muted">{i + 2}</span>
              <span className="relative h-11 w-[5.5rem] shrink-0 overflow-hidden rounded-[3px] bg-surface-2">
                {d.game.headerUrl && <Image src={d.game.headerUrl} alt="" fill sizes="88px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium group-hover:text-accent">{d.game.title}</span>
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
  );
}

export default async function Home() {
  const [pool, { items: cheap, total: dealCount }] = await Promise.all([getDealPool(), getDeals({ limit: 24, sort: "preco" })]);
  const featuredDeals = pickFeaturedDeals(pool, 18);
  const preorders = pickPreorderDeals(pool, 6);
  const preorderDates = new Map(preorders.map((s) => [s.game.id, s.game.releaseDate?.replace(/\./g, "")]));
  const [featured, ...rest] = featuredDeals;
  const deals = featuredDeals.slice(1 + 5); // o destaque e a lista lateral já usam os primeiros
  // os mais baratos não repetem o que já apareceu acima
  const shown = new Set(featuredDeals.map((d) => d.game.id));
  const cheapest = cheap.filter((d) => !shown.has(d.game.id)).slice(0, 12);
  const stores = Object.values(STORES);

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-8 lg:px-6">
      {featured ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Featured deal={featured} />
          {rest.length > 0 && <TopDeals deals={rest.slice(0, 5)} />}
        </section>
      ) : (
        <section className="rounded-card border border-line bg-surface p-10 text-center">
          <h1 className="font-display text-3xl font-bold uppercase">{BRAND.tagline}</h1>
          <p className="mt-2 text-text-2">Busque um jogo no topo da página para adicioná-lo ao catálogo.</p>
        </section>
      )}

      {deals.length > 0 && (
        <section>
          <SectionHeader id="ofertas" title="Promos imperdíveis" aside={<SeeAll href="/ofertas" label={`Ver todas as ${dealCount} ofertas`} />} />
          <GameGrid games={deals} />
        </section>
      )}

      {cheapest.length > 0 && (
        <section>
          <SectionHeader id="menores-precos" title="Quase de graça" aside={<SeeAll href="/ofertas" label="Ver todas as ofertas" />} />
          <GameGrid games={cheapest} />
        </section>
      )}

      {preorders.length > 0 && (
        <section>
          <SectionHeader id="pre-venda" title="Pré-venda com desconto" aside="Só jogos que ainda não saíram e já têm desconto" />
          <GameGrid games={preorders} releaseLabel={(c) => `Lança em ${preorderDates.get(c.game.id)}`} />
        </section>
      )}

      <section>
        <SectionHeader id="lojas" title="Lojas monitoradas" aside={`${stores.filter((s) => s.status === "active").length} de ${stores.length} ativas`} />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stores.map((s) => (
            <li key={s.id} className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3">
              <StoreLogo store={s.id} size={32} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{s.name}</span>
                <span className={`text-xs ${s.status === "active" ? "text-accent" : "text-muted"}`}>
                  {s.status === "active" ? "Comparando" : "Em breve"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
