import Link from "next/link";
import { GameGrid } from "@/components/game-card";
import { FeaturedShowcase, type ShowcaseItem } from "@/components/featured-showcase";
import { StoreLogo } from "@/components/store-logo";
import { SectionHeader } from "@/components/ui";
import { getDeals, getDealPool, pickFeaturedDeals, pickPreorderDeals } from "@/db/queries";
import { BRAND } from "@/lib/brand";
import { STORES } from "@/lib/stores";

export const revalidate = 300;

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="font-medium text-text-2 transition hover:text-accent">
      {label} →
    </Link>
  );
}

export default async function Home() {
  const [pool, { items: cheap, total: dealCount }] = await Promise.all([getDealPool(), getDeals({ limit: 24, sort: "preco" })]);
  const featuredDeals = pickFeaturedDeals(pool, 18);
  const preorders = pickPreorderDeals(pool, 6);
  const preorderDates = new Map(preorders.map((s) => [s.game.id, s.game.releaseDate?.replace(/\./g, "")]));
  // o banner rotativo e a lista "Drops em destaque" usam os 6 primeiros
  const showcase: ShowcaseItem[] = featuredDeals.slice(0, 6).map((d) => ({
    slug: d.game.slug,
    title: d.game.title,
    headerUrl: d.game.headerUrl,
    backgroundUrl: d.game.backgroundUrl,
    bestPriceCents: d.bestPriceCents,
    regularPriceCents: d.regularPriceCents,
    maxDiscount: d.maxDiscount,
    bestStore: d.bestStore,
  }));
  const deals = featuredDeals.slice(6);
  // os mais baratos não repetem o que já apareceu acima
  const shown = new Set(featuredDeals.map((d) => d.game.id));
  const cheapest = cheap.filter((d) => !shown.has(d.game.id)).slice(0, 12);
  const stores = Object.values(STORES);

  return (
    <div className="mx-auto max-w-7xl space-y-14 px-4 py-8 lg:px-6">
      {showcase.length ? (
        <FeaturedShowcase items={showcase} />
      ) : (
        <section className="rounded-card border border-line bg-surface p-10 text-center">
          <h1 className="font-display text-3xl font-bold uppercase">{BRAND.tagline}</h1>
          <p className="mt-2 text-text-2">Busque um jogo no topo da página para adicioná-lo ao catálogo.</p>
        </section>
      )}

      {deals.length > 0 && (
        <section>
          <SectionHeader id="ofertas" title="Promos imperdíveis" icon="flame" aside={<SeeAll href="/ofertas" label={`Ver todas as ${dealCount} ofertas`} />} />
          <GameGrid games={deals} />
        </section>
      )}

      {cheapest.length > 0 && (
        <section>
          <SectionHeader id="menores-precos" title="Quase de graça" icon="coin" aside={<SeeAll href="/ofertas" label="Ver todas as ofertas" />} />
          <GameGrid games={cheapest} />
        </section>
      )}

      {preorders.length > 0 && (
        <section>
          <SectionHeader id="pre-venda" title="Pré-venda com desconto" icon="clock" aside="Só jogos que ainda não saíram e já têm desconto" />
          <GameGrid games={preorders} releaseLabel={(c) => `Lança em ${preorderDates.get(c.game.id)}`} />
        </section>
      )}

      <section>
        <SectionHeader id="lojas" title="Lojas monitoradas" icon="store" aside={`${stores.filter((s) => s.status === "active").length} de ${stores.length} ativas`} />
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
