import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AlertButton } from "@/components/alert-button";
import { CoverImage } from "@/components/cover-image";
import { Icon } from "@/components/icon";
import { BackToTop } from "@/components/back-to-top";
import { RarityInfo } from "@/components/rarity-info";
import { EnrichmentWatcher } from "@/components/enrichment-watcher";
import { MediaGallery } from "@/components/media-gallery";
import { PriceHistoryChart } from "@/components/price-history-chart";
import { PriceTable } from "@/components/price-table";
import { Requirements } from "@/components/requirements";
import { SimilarGames } from "@/components/similar-games";
import { PlatformFilter } from "@/components/platform-filter";
import { StoreLogo, StoreName } from "@/components/store-logo";
import { TimeToBeatCard } from "@/components/time-to-beat";
import { WishlistButton } from "@/components/wishlist-button";
import { buttonStyles, DiscountBadge, MetacriticBadge, PriceText, SectionHeader, Tag } from "@/components/ui";
import { getGamePage, type GamePageData } from "@/db/queries";
import { bestByFamily, type FamilyKey } from "@/lib/best-by-family";
import { priceRarity } from "@/lib/rarity";
import { formatCents, formatRelative } from "@/lib/format";
import { getStore, offerFamilies, PLATFORM_FAMILIES, PLATFORM_LABELS, STORES, type PlatformFamilyId } from "@/lib/stores";

export const revalidate = 300;

// Array vazio = nenhuma página gerada no build; cada jogo é gerado na primeira visita e revalidado a cada 5 min (ISR)
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: PageProps<"/jogo/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const data = await getGamePage(slug);
  if (!data) return {};
  const best = data.offers[0]?.finalCents;
  return {
    title: `${data.game.title} — menor preço`,
    description:
      best != null
        ? `${data.game.title} a partir de ${formatCents(best)}. Compare preços em ${data.offers.length} lojas.`
        : (data.game.shortDescription ?? undefined),
    openGraph: { images: data.game.headerUrl ? [data.game.headerUrl] : undefined },
  };
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

/** Lojas do histórico por família (o histórico da ITAD não diz a plataforma, só a loja). */
const STORE_FAMILY: Record<string, PlatformFamilyId> = { psstore: "playstation", nintendo: "nintendo", xbox: "xbox" };

/** Preço de vitrine atual e menor já registrado, por plataforma — para o diálogo de alerta. */
function alertPrices(data: GamePageData) {
  const best = bestByFamily(
    data.offers.flatMap((o) =>
      o.snapshot
        ? [{ store: o.listing.store, platform: o.listing.platform, edition: o.listing.edition, cents: o.snapshot.priceCents, regularCents: o.snapshot.regularPriceCents, discountPercent: o.snapshot.discountPercent }]
        : [],
    ),
  );
  const prices: Partial<Record<FamilyKey, number>> = Object.fromEntries([...best].map(([k, v]) => [k, v.cents]));

  // brindes (R$ 0 numa promoção) não contam como menor preço
  const lows: Partial<Record<FamilyKey, number>> = {};
  for (const s of data.series) {
    const family = STORE_FAMILY[s.store] ?? "pc";
    for (const [, cents] of s.points) if (cents > 0 && (lows[family] == null || cents < lows[family]!)) lows[family] = cents;
  }
  if (data.historicLow) lows.all = data.historicLow.cents;
  return { prices, lows };
}

function familyCounts(offers: GamePageData["offers"]) {
  const counts: Partial<Record<PlatformFamilyId, number>> = {};
  for (const o of offers) for (const f of offerFamilies(o.listing)) counts[f] = (counts[f] ?? 0) + 1;
  return counts;
}

/** Menor preço em cada plataforma — comparar uma chave de PC com um jogo de PS5 não ajuda quem tem PS5. */
/** Rótulos de plataforma do IGDB (guardados em game.platforms) → plataformas das nossas lojas. */
const IGDB_PLATFORM_IDS: Record<string, string[]> = {
  PC: ["pc"],
  PS5: ["ps5"],
  PS4: ["ps4"],
  "Xbox Series X|S": ["xbox"],
  "Xbox One": ["xbox"],
  Switch: ["switch"],
  "Switch 2": ["switch2"],
};

function PlatformBests({ offers }: { offers: GamePageData["offers"] }) {
  const bests = PLATFORM_FAMILIES.flatMap((family) => {
    const cheapest = offers.find((o) => o.finalCents != null && offerFamilies(o.listing).includes(family.id));
    return cheapest ? [{ family, offer: cheapest }] : [];
  });
  if (bests.length < 2) return null;
  return (
    <div className="border-t border-line px-5 py-3">
      <p className="mb-2 font-display text-xs font-semibold uppercase tracking-[0.15em] text-muted">Melhor por plataforma</p>
      <ul className="space-y-1.5">
        {bests.map(({ family, offer }) => (
          <li key={family.id}>
            <a
              href={offer.listing.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group flex items-center gap-2.5 text-sm"
              title={`${family.label}: ${getStore(offer.listing.store)?.name ?? offer.listing.store}`}
            >
              <StoreLogo store={offer.listing.store} size={22} />
              <span className="flex-1 text-text-2 group-hover:text-text">{family.label}</span>
              {offer.snapshot && offer.snapshot.discountPercent > 0 && <DiscountBadge percent={offer.snapshot.discountPercent} size="sm" />}
              <PriceText cents={offer.finalCents!} className="font-semibold group-hover:text-accent" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BestOfferPanel({ data }: { data: GamePageData }) {
  const best = data.offers[0];
  const low = data.historicLow;
  if (!best?.snapshot || best.finalCents == null) {
    return (
      <div className="rounded-card border border-line bg-surface p-5 text-sm text-text-2">Ainda não encontramos este jogo à venda.</div>
    );
  }
  const rarity = priceRarity(best.snapshot.discountPercent);
  const storeName = getStore(best.listing.store)?.name ?? best.listing.store;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.15em] text-text-2">
            <Icon name="trophy" className="size-4 text-accent" />
            Melhor drop
          </span>
          {rarity && <RarityInfo rarity={rarity} />}
        </div>
        <div className="flex items-center justify-between gap-2">
          <StoreName store={best.listing.store} size={32} />
          <Tag>{PLATFORM_LABELS[best.listing.platform]}</Tag>
        </div>
        <div>
          {best.snapshot.discountPercent > 0 && (
            <div className="mb-1 flex items-center gap-2">
              <DiscountBadge percent={best.snapshot.discountPercent} />
              <span className="tabular text-sm text-muted line-through">{formatCents(best.snapshot.regularPriceCents)}</span>
            </div>
          )}
          <PriceText cents={best.finalCents} className="font-display text-5xl font-bold leading-none text-accent" />
          {best.coupon?.coupon && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-coupon">
              <Icon name="ticket" className="size-3.5 shrink-0" />
              Com cupom {best.coupon.coupon.code ?? "automático"} (−{formatCents(best.coupon.savedCents)})
            </p>
          )}
          {best.listing.voucher && <p className="mt-2 text-xs text-coupon">Use o código {best.listing.voucher} no checkout</p>}
        </div>
        <div className="space-y-2">
          <a href={best.listing.url} target="_blank" rel="noopener noreferrer sponsored" className={`${buttonStyles.primary} w-full`}>
            Comprar na {storeName} <span aria-hidden>↗</span>
          </a>
          {/* alertas comparam preço de vitrine (sem cupom), igual ao histórico */}
          <AlertButton gameId={data.game.id} gameTitle={data.game.title} {...alertPrices(data)} />
        </div>
      </div>
      <PlatformBests offers={data.offers} />
      <dl className="divide-y divide-line border-t border-line text-sm">
        {low && (
          <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
            <dt className="flex items-center gap-1.5 text-muted">
              <Icon name="floor" className="size-4" />
              Piso histórico
            </dt>
            <dd className="text-right">
              <PriceText cents={low.cents} className="font-semibold" />
              {low.date && (
                <span className="block text-xs text-muted">
                  {dateFmt.format(low.date)}
                  {low.store && ` · ${getStore(low.store)?.name ?? low.store}`}
                </span>
              )}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-3 px-5 py-2.5">
          <dt className="flex items-center gap-1.5 text-muted">
            <Icon name="store" className="size-4" />
            Lojas comparadas
          </dt>
          <dd className="tabular">{data.offers.length}</dd>
        </div>
        {data.lastChecked && (
          <div className="flex justify-between gap-3 px-5 py-2.5">
            <dt className="text-muted">Atualizado</dt>
            <dd>{formatRelative(data.lastChecked)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function DetailsPanel({ data }: { data: GamePageData }) {
  const { game } = data;
  const rows = [
    ["Desenvolvedora", game.developers.join(", ")],
    ["Distribuidora", game.publishers.join(", ")],
    ["Lançamento", game.releaseDate],
    ["Gêneros", game.genres.join(", ")],
    ["Plataformas", game.platforms.join(", ")],
    ["Modos", game.gameModes.join(", ")],
    ["Perspectiva", game.perspectives.join(", ")],
    ["Temas", game.themes.join(", ")],
  ].filter(([, v]) => v) as [string, string][];
  return (
    <div className="rounded-card border border-line bg-surface">
      <h2 className="border-b border-line px-5 py-3 font-display text-sm font-semibold uppercase tracking-[0.15em] text-text-2">Detalhes</h2>
      <dl className="divide-y divide-line text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 px-5 py-2.5">
            <dt className="text-muted">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        {game.metacritic != null && (
          <div className="flex items-center justify-between gap-3 px-5 py-2.5">
            <dt className="text-muted">Metacritic</dt>
            <dd>
              <MetacriticBadge score={game.metacritic} />
            </dd>
          </div>
        )}
        {game.criticRating != null && (
          <div className="flex items-center justify-between gap-3 px-5 py-2.5">
            <dt className="text-muted">
              <span className="flex items-center gap-1.5">
                <Icon name="star" className="size-4" />
                Média da crítica
              </span>
              {game.criticRatingCount != null && (
                <span className="block text-xs">
                  {game.criticRatingCount} {game.criticRatingCount === 1 ? "análise" : "análises"} · IGDB
                </span>
              )}
            </dt>
            <dd>
              <MetacriticBadge score={game.criticRating} label="Média da crítica (IGDB)" />
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

export default async function GamePage(props: PageProps<"/jogo/[slug]">) {
  const { slug } = await props.params;
  const data = await getGamePage(slug);
  if (!data) notFound();

  const { game, offers, screenshots, videos, series } = data;
  const coveredStores = new Set(offers.map((o) => o.listing.store));
  // só lista lojas das plataformas em que o jogo existe (um exclusivo de PlayStation não "falta" na Steam)
  const gamePlatforms = new Set(game.platforms.flatMap((p) => IGDB_PLATFORM_IDS[p] ?? []));
  const missingStores = Object.values(STORES).filter(
    (s) => !coveredStores.has(s.id) && (gamePlatforms.size === 0 || s.platforms.some((p) => gamePlatforms.has(p))),
  );
  const steamUrl = offers.find((o) => o.listing.store === "steam")?.listing.url ?? null;
  // recém-importado pela busca: as outras lojas ainda estão sendo consultadas em segundo plano
  const enriching = game.enrichedAt == null && data.generatedAt - game.createdAt.getTime() < 10 * 60_000;

  return (
    <article>
      <header className="relative overflow-hidden border-b border-line">
        {game.backgroundUrl && (
          <Image src={game.backgroundUrl} alt="" fill priority sizes="100vw" className="object-cover object-center opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/80 via-bg/20 to-transparent" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-8 pt-16 sm:flex-row sm:items-end lg:px-6 lg:pt-28">
          <div className="relative aspect-[2/3] w-36 shrink-0 overflow-hidden rounded-card border border-line-strong bg-surface shadow-2xl shadow-black/60 sm:w-48 lg:w-56">
            <CoverImage src={game.coverUrl} title={game.title} sizes="224px" priority />
          </div>
          <div className="min-w-0 pb-1">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {game.genres.slice(0, 4).map((g) => (
                <Tag key={g}>{g}</Tag>
              ))}
            </div>
            <h1 className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">{game.title}</h1>
            <p className="mt-3 text-sm text-text-2">{[game.developers[0], game.releaseDate].filter(Boolean).join(" · ")}</p>
            <div className="mt-4">
              <WishlistButton gameId={game.id} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-6">
        <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:self-start">
          <BestOfferPanel data={data} />
          {/* no celular, preço vem primeiro: tempo e detalhes descem para depois do conteúdo principal */}
          <div className="hidden space-y-4 lg:block">
            {game.timeToBeat && <TimeToBeatCard ttb={game.timeToBeat} bestPriceCents={offers[0]?.finalCents ?? null} />}
            <DetailsPanel data={data} />
          </div>
        </aside>

        <div className="min-w-0 space-y-12 lg:col-start-1 lg:row-start-1">
          {enriching && <EnrichmentWatcher gameId={game.id} slug={game.slug} />}
          <BackToTop />

          <section>
            <SectionHeader title="Onde comprar" icon="cart" aside="Preços em R$, ordenados pelo valor final" />
            {offers.length ? (
              <PlatformFilter counts={familyCounts(offers)} total={offers.length}>
                <PriceTable offers={offers} />
              </PlatformFilter>
            ) : (
              <p className="text-text-2">Ainda não encontramos este jogo em nenhuma loja.</p>
            )}
            {missingStores.length > 0 && (
              <p className="mt-3 text-xs text-muted">Ainda não comparado em: {missingStores.map((s) => s.name).join(", ")}.</p>
            )}
          </section>

          <section>
            <SectionHeader title="Histórico de preços" icon="chart" aside="Ative as lojas na legenda para comparar" />
            <PriceHistoryChart series={series} now={data.generatedAt} />
          </section>

          {game.timeToBeat && (
            <div className="lg:hidden">
              <TimeToBeatCard ttb={game.timeToBeat} bestPriceCents={offers[0]?.finalCents ?? null} />
            </div>
          )}

          {(screenshots.length > 0 || videos.length > 0) && (
            <section>
              <SectionHeader title="Imagens e vídeos" icon="photo" aside={[videos.length && `${videos.length} ${videos.length === 1 ? "trailer" : "trailers"}`, `${screenshots.length} imagens`].filter(Boolean).join(" · ")} />
              <MediaGallery screenshots={screenshots} videos={videos} title={game.title} storeUrl={steamUrl} />
            </section>
          )}

          {game.shortDescription && (
            <section>
              <SectionHeader title="Sobre o jogo" icon="book" />
              <p className="max-w-3xl text-base leading-relaxed text-text-2">{game.shortDescription}</p>
            </section>
          )}

          {game.requirements && (
            <section>
              <SectionHeader title="Requisitos para PC" icon="cpu" aside="Informados pela Steam" />
              <Requirements requirements={game.requirements} />
            </section>
          )}

          {data.similar.length > 0 && (
            <section>
              <SectionHeader title="Quem joga isso também joga" icon="users" aside="Sugestões do IGDB" />
              <SimilarGames games={data.similar} />
            </section>
          )}

          <div className="lg:hidden">
            <DetailsPanel data={data} />
          </div>
        </div>
      </div>
    </article>
  );
}
