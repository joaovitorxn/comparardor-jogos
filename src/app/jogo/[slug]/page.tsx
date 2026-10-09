import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AlertButton } from "@/components/alert-button";
import { CoverImage } from "@/components/cover-image";
import { GameCard } from "@/components/game-card";
import { ScrollRow } from "@/components/scroll-row";
import { DeckBadge } from "@/components/deck-badge";
import { Icon } from "@/components/icon";
import { BestOfferSwitch, type BestOfferChoice } from "@/components/best-offer-switch";
import { JsonLd } from "@/components/json-ld";
import { BackToTop } from "@/components/back-to-top";
import { BuyVerdictSwitch } from "@/components/buy-verdict-switch";
import { GiftCardHint } from "@/components/gift-card-hint";
import { EnrichmentWatcher } from "@/components/enrichment-watcher";
import { MediaGallery } from "@/components/media-gallery";
import { PriceHistoryChart } from "@/components/price-history-chart";
import { PriceTable } from "@/components/price-table";
import { Requirements } from "@/components/requirements";
import { SimilarGames } from "@/components/similar-games";
import { PlatformFilter } from "@/components/platform-filter";
import { StoreName } from "@/components/store-logo";
import { TimeToBeatCard } from "@/components/time-to-beat";
import { ShareButton } from "@/components/share-button";
import { WishlistButton } from "@/components/wishlist-button";
import { UserScoreInline } from "@/components/user-score";
import { buttonStyles, DiscountBadge, MetacriticBadge, PriceText, quietHeader, SectionHeader, Tag } from "@/components/ui";
import { CollapsibleSection } from "@/components/collapsible-section";
import { MobileBuyBar } from "@/components/mobile-buy-bar";
import { getGamePage, type GamePageData } from "@/db/queries";
import { bestByFamily, type FamilyKey } from "@/lib/best-by-family";
import { lightImage } from "@/lib/images";
import { brazilianPortuguese, flagFor } from "@/lib/languages";
import { allPlatformCombinations, serializePlatforms } from "@/lib/platform-selection";
import { SITE_URL } from "@/lib/site";
import type { GameLanguage } from "@/lib/languages";
import { buildVerdictViews } from "@/lib/verdict-variants";
import { formatCents, formatRelative } from "@/lib/format";
import { getStore, offerFamilies, PLATFORM_LABELS, STORES, type PlatformFamilyId } from "@/lib/stores";

// cada regeneração conta como uma escrita de ISR (limite do plano gratuito da Vercel): o robô de coleta não descarta mais
// o cache de todas as páginas de jogo, elas se renovam sozinhas a cada 6 horas
export const revalidate = 21600;

// Array vazio = nenhuma página gerada no build; cada jogo é gerado na primeira visita e revalidado a cada 6 h (ISR)
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
    alternates: { canonical: `/jogo/${data.game.slug}` },
  };
}

/** Frase que acompanha o link ao compartilhar: jogo, preço e desconto da melhor oferta. */
function shareText(data: GamePageData): string {
  const best = data.offers.find((o) => o.snapshot && o.finalCents != null);
  if (!best?.snapshot) return `${data.game.title} no Dropou`;
  const store = getStore(best.listing.store)?.name ?? best.listing.store;
  const price = best.finalCents === 0 ? "de graça" : `por ${formatCents(best.finalCents!)}`;
  const off = best.snapshot.discountPercent > 0 ? ` (-${best.snapshot.discountPercent}%)` : "";
  return `${data.game.title} ${price}${off} na ${store}. Dropou:`;
}


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

/** Barra compacta da melhor oferta, para o rodapé do celular (ver MobileBuyBar). */
function BestOfferBar({ best }: { best: GamePageData["offers"][number] }) {
  const snapshot = best.snapshot!;
  const storeName = getStore(best.listing.store)?.name ?? best.listing.store;
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {snapshot.discountPercent > 0 && <DiscountBadge percent={snapshot.discountPercent} size="sm" />}
          <span className="truncate text-xs text-text-2">na {storeName}</span>
        </div>
        <PriceText cents={best.finalCents!} className="font-display text-3xl font-bold leading-none text-accent" />
      </div>
      <a
        href={best.listing.url}
        data-track="buy"
        data-store={best.listing.store}
        data-game={best.listing.gameId}
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label={`Comprar na ${storeName}`}
        className={`${buttonStyles.primary} min-h-12 shrink-0 px-6`}
      >
        Comprar <span aria-hidden>↗</span>
      </a>
    </div>
  );
}

/** Cartão do "Melhor drop" de uma oferta: loja, preço, botão de compra e alerta. */
function BestOfferCard({ data, best }: { data: GamePageData; best: GamePageData["offers"][number] }) {
  const snapshot = best.snapshot!;
  const storeName = getStore(best.listing.store)?.name ?? best.listing.store;

  return (
    <div className="space-y-4 p-5">
        <span className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.15em] text-text-2">
          <Icon name="trophy" className="size-4 text-accent" />
          Melhor drop
        </span>
        <div className="flex items-center justify-between gap-2">
          <StoreName store={best.listing.store} size={32} />
          <Tag>{PLATFORM_LABELS[best.listing.platform]}</Tag>
        </div>
        <div>
          {snapshot.discountPercent > 0 && (
            <div className="mb-2 flex items-center gap-3">
              <DiscountBadge percent={snapshot.discountPercent} size="xl" />
              <span className="tabular text-sm text-muted line-through">{formatCents(snapshot.regularPriceCents)}</span>
            </div>
          )}
          <PriceText cents={best.finalCents!} className="font-display text-5xl font-bold leading-none text-accent" />
          {best.finalCents! < snapshot.regularPriceCents && (
            <p className="mt-2 text-sm text-text-2">
              Você economiza <span className="tabular font-semibold text-accent">{formatCents(snapshot.regularPriceCents - best.finalCents!)}</span>
            </p>
          )}
          {best.listing.voucher && <p className="mt-2 text-xs text-coupon">Use o código {best.listing.voucher} no checkout</p>}
        </div>
        <div className="space-y-2">
          <a
            href={best.listing.url}
            data-track="buy"
            data-store={best.listing.store}
            data-game={best.listing.gameId}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`${buttonStyles.primary} w-full`}
          >
            Comprar na {storeName} <span aria-hidden>↗</span>
          </a>
          <AlertButton gameId={data.game.id} gameTitle={data.game.title} {...alertPrices(data)} />
        </div>
    </div>
  );
}

function BestOfferPanel({ data }: { data: GamePageData }) {
  const overall = data.offers.find((o) => o.snapshot && o.finalCents != null);
  if (!overall) {
    return (
      <div className="rounded-card border border-line bg-surface p-5 text-sm text-text-2">Este jogo ainda não foi encontrado à venda.</div>
    );
  }

  // O "Melhor drop" muda conforme as plataformas escolhidas no cabeçalho. Preparamos o cartão da melhor oferta de
  // cada combinação possível (as ofertas já vêm da mais barata para a mais cara) e o cliente só escolhe qual mostrar.
  const choices: Record<string, BestOfferChoice> = {};
  const used = new Map<number, GamePageData["offers"][number]>();
  for (const combo of [[], ...allPlatformCombinations()]) {
    const mine = combo.length ? data.offers.find((o) => o.snapshot && o.finalCents != null && offerFamilies(o.listing).some((f) => combo.includes(f))) : overall;
    const chosen = mine ?? overall;
    choices[serializePlatforms(combo)] = { offerId: chosen.listing.id, fallback: !mine };
    used.set(chosen.listing.id, chosen);
  }
  const options = Object.fromEntries([...used].map(([id, offer]) => [id, <BestOfferCard key={id} data={data} best={offer} />]));
  const bars = Object.fromEntries([...used].map(([id, offer]) => [id, <BestOfferBar key={id} best={offer} />]));

  return (
    <div id="melhor-drop" className="overflow-hidden rounded-card border border-line bg-surface">
      <BestOfferSwitch choices={choices} options={options} />
      <dl className="divide-y divide-line border-t border-line text-sm">
        {data.lastChecked && (
          <div className="flex justify-between gap-3 px-5 py-2.5">
            <dt className="text-muted">Atualizado</dt>
            <dd>{formatRelative(data.lastChecked)}</dd>
          </div>
        )}
      </dl>
      <MobileBuyBar choices={choices} options={bars} />
    </div>
  );
}

/** Tabela de idiomas no estilo da Steam: o texto (interface e legendas) está em todos; a dublagem só em alguns. */
function LanguagesPanel({ languages }: { languages: GameLanguage[] }) {
  const th = "px-2 py-2 text-center font-normal";
  return (
    <div className="rounded-card border border-line bg-surface">
      <h2 className={quietHeader}>
        <Icon name="globe" className="size-4" />
        Idiomas
      </h2>
      <table className="w-full text-sm">
        <caption className="sr-only">Idiomas suportados</caption>
        <thead>
          <tr className="text-xs text-muted">
            <th scope="col" className="px-5 py-2 text-left font-normal">
              Idioma
            </th>
            <th scope="col" className={th}>
              Texto
            </th>
            <th scope="col" className={`${th} pr-5`}>
              Dublagem
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line border-t border-line">
          {languages.map((l) => {
            const pt = brazilianPortuguese([l]) != null;
            const flag = flagFor(l.name);
            return (
              <tr key={l.name} className={pt ? "bg-accent-soft font-medium text-accent" : undefined}>
                <th scope="row" className="px-5 py-1.5 text-left font-normal">
                  <span className="flex items-center gap-2.5">
                    {flag ? (
                      <Image src={`/flags/${flag}.svg`} alt="" width={20} height={15} unoptimized className="h-[15px] w-5 shrink-0 rounded-[2px] border border-line-strong object-cover" />
                    ) : (
                      <span className="w-5 shrink-0" aria-hidden />
                    )}
                    {l.name}
                  </span>
                </th>
                <td className="px-2 py-1.5 text-center">
                  <Icon name="check" className="mx-auto size-4 text-accent" />
                  <span className="sr-only">Sim</span>
                </td>
                <td className="px-2 py-1.5 pr-5 text-center">
                  {l.audio ? (
                    <>
                      <Icon name="check" className="mx-auto size-4 text-accent" />
                      <span className="sr-only">Sim</span>
                    </>
                  ) : (
                    <span className="text-muted" aria-label="Não">
                      —
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
      <h2 className={quietHeader}>
        <Icon name="list" className="size-4" />
        Detalhes
      </h2>
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

/** Dados estruturados do jogo (schema.org/Product) para o Google mostrar preço e disponibilidade. */
function productJsonLd({ game, offers }: GamePageData) {
  const url = `${SITE_URL}/jogo/${game.slug}`;
  const priced = offers.flatMap((o) => (o.finalCents != null && o.snapshot ? [{ ...o, cents: o.finalCents }] : []));
  const price = (cents: number) => (cents / 100).toFixed(2);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: game.title,
    url,
    image: [game.coverUrl, game.headerUrl].filter(Boolean),
    description: game.shortDescription ?? `${game.title}: compare preços em várias lojas.`,
    sku: `dropou-${game.id}`,
    category: "Jogos",
    ...(game.publishers[0] ? { brand: { "@type": "Brand", name: game.publishers[0] } } : {}),
    ...(priced.length
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "BRL",
            lowPrice: price(Math.min(...priced.map((o) => o.cents))),
            highPrice: price(Math.max(...priced.map((o) => o.cents))),
            offerCount: priced.length,
            offers: priced.map((o) => ({
              "@type": "Offer",
              price: price(o.cents),
              priceCurrency: "BRL",
              availability: "https://schema.org/InStock",
              url: o.listing.url,
              seller: { "@type": "Organization", name: getStore(o.listing.store)?.name ?? o.listing.store },
            })),
          },
        }
      : {}),
  };
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
  const verdicts = buildVerdictViews(data);
  const enriching = game.enrichedAt == null && data.generatedAt - game.createdAt.getTime() < 10 * 60_000;

  return (
    <article>
      <JsonLd data={productJsonLd(data)} />
      <header className="relative border-b border-line">
        {/* o recorte fica só no fundo: a janelinha do selo do Steam Deck precisa poder passar da borda do cabeçalho */}
        <div className="absolute inset-0 overflow-hidden">
          {game.backgroundUrl && (
            <Image src={lightImage(game.backgroundUrl)} alt="" fill priority sizes="100vw" className="object-cover object-center opacity-80" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bg/80 via-bg/20 to-transparent" />
        </div>

        {/* celular: capa pequena ao lado do título, para o preço aparecer cedo; a partir de sm, capa grande à esquerda */}
        <div className="relative mx-auto grid max-w-7xl grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 gap-y-4 px-4 pb-6 pt-10 sm:grid-cols-[auto_minmax(0,1fr)] sm:grid-rows-[1fr_auto] sm:gap-x-6 sm:gap-y-3 sm:pb-8 lg:px-6 lg:pt-28">
          <div className="relative aspect-[2/3] w-full shrink-0 self-end overflow-hidden rounded-card border border-line-strong bg-surface shadow-2xl shadow-black/60 sm:row-span-2 sm:w-48 lg:w-56">
            <CoverImage src={game.coverUrl} title={game.title} sizes="224px" priority />
          </div>
          <div className="min-w-0 self-end">
            <div className="mb-3 flex flex-wrap gap-1.5">
              <DeckBadge status={game.deckStatus} />
              {game.genres.slice(0, 4).map((g) => (
                <Tag key={g}>{g}</Tag>
              ))}
            </div>
            <h1 className="font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">{game.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-sm text-text-2">{[game.developers[0], game.releaseDate].filter(Boolean).join(" · ")}</p>
              {game.userScore != null && (game.userReviewCount ?? 0) >= 10 && <UserScoreInline percent={game.userScore} count={game.userReviewCount!} />}
            </div>
          </div>
          <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-span-1 sm:col-start-2">
            <WishlistButton gameId={game.id} />
            <ShareButton url={`${SITE_URL}/jogo/${game.slug}`} text={shareText(data)} imageUrl={`/jogo/${game.slug}/cartao`} filename={`dropou-${game.slug}.jpg`} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-8 px-4 pb-24 pt-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-6 lg:pb-8">
        <aside className="space-y-4 lg:col-start-2 lg:row-start-1 lg:self-start">
          <BestOfferPanel data={data} />
          <BuyVerdictSwitch {...verdicts} />
          {/* no celular, preço vem primeiro: tempo e detalhes descem para depois do conteúdo principal */}
          <div className="hidden space-y-4 lg:block">
            {game.timeToBeat && <TimeToBeatCard ttb={game.timeToBeat} bestPriceCents={offers[0]?.finalCents ?? null} />}
            <DetailsPanel data={data} />
            {game.languages?.length ? <LanguagesPanel languages={game.languages} /> : null}
          </div>
        </aside>

        <div className="min-w-0 space-y-12 lg:col-start-1 lg:row-start-1">
          {enriching && <EnrichmentWatcher gameId={game.id} slug={game.slug} />}
          <BackToTop />

          <section>
            <SectionHeader title="Onde comprar" icon="cart" aside="Preços em R$, do menor para o maior" />
            {offers.length ? (
              <PlatformFilter counts={familyCounts(offers)} total={offers.length}>
                <PriceTable offers={offers} />
                <GiftCardHint families={[...new Set(offers.flatMap((o) => offerFamilies(o.listing)))]} />
              </PlatformFilter>
            ) : (
              <p className="text-text-2">Este jogo ainda não foi encontrado em nenhuma loja.</p>
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
              <CollapsibleSection title="Requisitos para PC" icon="cpu" aside="Informados pela Steam">
                <Requirements requirements={game.requirements} />
              </CollapsibleSection>
            </section>
          )}

          {data.moreFromPublisher && (
            <section>
              <SectionHeader title={`Mais de ${data.moreFromPublisher.publisher}`} icon="controller" />
              <ScrollRow label={`Mais jogos de ${data.moreFromPublisher.publisher}`}>
                {data.moreFromPublisher.games.map((s) => (
                  <li key={s.game.id} className="flex w-36 shrink-0 snap-start sm:w-40">
                    <div className="flex w-full flex-col [&>a]:flex-1">
                      <GameCard summary={s} />
                    </div>
                  </li>
                ))}
              </ScrollRow>
            </section>
          )}

          {data.similar.length > 0 && (
            <section>
              <SectionHeader title="Quem joga isso também joga" icon="users" aside="Sugestões do IGDB" />
              <SimilarGames games={data.similar} />
            </section>
          )}

          <div className="space-y-4 lg:hidden">
            <DetailsPanel data={data} />
            {game.languages?.length ? <LanguagesPanel languages={game.languages} /> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
