import Link from "next/link";
import { GameGrid } from "@/components/game-card";
import { JsonLd } from "@/components/json-ld";
import { GiftCardStrip } from "@/components/gift-card-hint";
import { FeaturedShowcase, type ShowcaseItem } from "@/components/featured-showcase";
import { StoreLogo } from "@/components/store-logo";
import { SectionHeader } from "@/components/ui";
import { getDealPool, getRecentReleases, getShowcaseImages, pickCheapestDeals, pickFeaturedDeals, pickPreorderDeals } from "@/db/queries";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";
import { STORES, type PlatformFamilyId } from "@/lib/stores";

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="font-medium text-text-2 transition hover:text-accent">
      {label} →
    </Link>
  );
}

/** "Lançou hoje", "Lançou ontem" ou "Lançou há N dias" (o dia do lançamento vem em ms). */
function launchLabel(releasedAt: number): string {
  const days = Math.max(0, Math.floor((Date.now() - releasedAt) / 86_400_000));
  return days === 0 ? "Lançou hoje" : days === 1 ? "Lançou ontem" : `Lançou há ${days} dias`;
}

/** Página inicial; com `platforms`, só as ofertas dessas plataformas (a versão normal passa lista vazia). */
export async function HomeView({ platforms = [] }: { platforms?: PlatformFamilyId[] }) {
  const [pool, releases] = await Promise.all([getDealPool(platforms), getRecentReleases(platforms, { limit: 12 })]);
  const releasedAt = new Map(releases.map((r) => [r.game.id, r.releasedAt]));
  const dealCount = pool.length;
  const cheap = pickCheapestDeals(pool, 24);
  const featuredDeals = pickFeaturedDeals(pool, 18);
  const preorders = pickPreorderDeals(pool, 6);
  const preorderDates = new Map(preorders.map((s) => [s.game.id, s.game.releaseDate?.replace(/\./g, "")]));
  // o banner rotativo e a lista "Drops em destaque" usam os 6 primeiros
  const images = await getShowcaseImages(featuredDeals.slice(0, 6).map((d) => d.game.id));
  const showcase: ShowcaseItem[] = featuredDeals.slice(0, 6).map((d) => ({
    slug: d.game.slug,
    title: d.game.title,
    headerUrl: images.get(d.game.id)?.headerUrl ?? null,
    backgroundUrl: images.get(d.game.id)?.backgroundUrl ?? null,
    lightHero: images.get(d.game.id)?.lightHero ?? false,
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
      {/* verificação de afiliado (Impact / Green Man Gaming); o React leva a tag para o <head>. O atributo é `value`, como a Impact pede */}
      <meta name="impact-site-verification" {...{ value: "80bbbd5a-6c43-4523-8d00-60a3054136a1" }} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: BRAND.name,
          url: SITE_URL,
          description: BRAND.description,
          inLanguage: "pt-BR",
          potentialAction: { "@type": "SearchAction", target: `${SITE_URL}/busca?q={search_term_string}`, "query-input": "required name=search_term_string" },
        }}
      />
      {showcase.length ? (
        // a faixa de Gift Cards fica colada embaixo dos drops em destaque (por isso o espaço menor que o das outras seções)
        <div className="space-y-4">
          <FeaturedShowcase items={showcase} />
          <GiftCardStrip families={platforms} />
        </div>
      ) : (
        <section className="rounded-card border border-line bg-surface p-10 text-center">
          <h1 className="font-display text-3xl font-bold uppercase">{BRAND.tagline}</h1>
          <p className="mt-2 text-text-2">
            {platforms.length
              ? "Não há promoções para as plataformas escolhidas agora. Volte mais tarde ou escolha outras no topo da página."
              : "Busque um jogo no topo da página para adicioná-lo ao catálogo."}
          </p>
        </section>
      )}

      {deals.length > 0 && (
        <section>
          <SectionHeader id="ofertas" title="Promos imperdíveis" icon="flame" aside={<SeeAll href="/ofertas" label={`Ver todas as ${dealCount} ofertas`} />} />
          <GameGrid games={deals} />
        </section>
      )}

      {releases.length >= 4 && (
        <section>
          <SectionHeader id="acabou-de-sair" title="Acabou de sair" icon="sparkles" aside="Principais lançamentos dos últimos 30 dias" />
          <GameGrid games={releases} releaseLabel={(c) => (releasedAt.has(c.game.id) ? launchLabel(releasedAt.get(c.game.id)!) : undefined)} />
        </section>
      )}

      {cheapest.length > 0 && (
        <section>
          <SectionHeader id="menores-precos" title="Quase de graça" icon="coin" aside={<SeeAll href="/ofertas?ordem=preco" label="Ver todas as ofertas" />} />
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
