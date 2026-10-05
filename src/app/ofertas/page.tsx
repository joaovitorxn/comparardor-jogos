import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { GameGrid } from "@/components/game-card";
import { PlatformNotice } from "@/components/platform-notice";
import { Icon, type IconName } from "@/components/icon";
import { Pagination, parsePage } from "@/components/pagination";
import { SectionHeader } from "@/components/ui";
import { getDealPool, pickCheapestDeals, rankDeals } from "@/db/queries";
import { parsePlatforms, PLATFORMS_COOKIE } from "@/lib/platform-selection";

const PAGE_SIZE = 30;

export const metadata: Metadata = {
  title: "Ofertas",
  alternates: { canonical: "/ofertas" },
  description: "Promoções de jogos que valem a pena agora, comparando Steam, GOG, Epic, Nuuvem, Green Man Gaming, Microsoft Store e consoles.",
};

const SORTS = [
  { id: "relevancia", label: "Relevância", icon: "flame", hint: "os que mais valem a pena primeiro" },
  { id: "desconto", label: "Maior desconto", icon: "tag", hint: "do maior desconto para o menor" },
  { id: "preco", label: "Menor preço", icon: "coin", hint: "do mais barato para o mais caro" },
] as const satisfies readonly { id: string; label: string; icon: IconName; hint: string }[];
type SortId = (typeof SORTS)[number]["id"];

export default async function DealsPage(props: PageProps<"/ofertas">) {
  const params = await props.searchParams;
  const page = parsePage(params.pagina);
  const sort: SortId = SORTS.find((s) => s.id === params.ordem)?.id ?? "relevancia";
  const offset = (page - 1) * PAGE_SIZE;

  // só as ofertas das plataformas que a pessoa escolheu no cabeçalho (todas, se não escolheu)
  const platforms = parsePlatforms((await cookies()).get(PLATFORMS_COOKIE)?.value);
  const pool = await getDealPool(platforms);
  const ranked =
    sort === "relevancia"
      ? rankDeals(pool)
      : sort === "preco"
        ? pickCheapestDeals(pool, Infinity)
        : [...pool].sort((a, b) => b.maxDiscount - a.maxDiscount || (a.bestPriceCents ?? Infinity) - (b.bestPriceCents ?? Infinity));
  const items = ranked.slice(offset, offset + PAGE_SIZE);
  const total = ranked.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (s: SortId, p = 1) => {
    const qs = new URLSearchParams();
    if (s !== "relevancia") qs.set("ordem", s);
    if (p > 1) qs.set("pagina", String(p));
    return qs.size ? `/ofertas?${qs}` : "/ofertas";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SectionHeader title="Ofertas" icon="tag" aside={`${total} jogos com desconto · ${SORTS.find((s) => s.id === sort)!.hint}`} />
      <PlatformNotice platforms={platforms} />
      <nav aria-label="Ordenar ofertas" className="mb-5 flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <Link
            key={s.id}
            href={href(s.id)}
            aria-current={s.id === sort ? "true" : undefined}
            className={`inline-flex h-9 items-center gap-1.5 rounded-[4px] border px-3 font-display text-sm font-semibold uppercase tracking-wider transition ${
              s.id === sort ? "border-accent bg-accent text-accent-ink" : "border-line text-text-2 hover:border-accent hover:text-accent"
            }`}
          >
            <Icon name={s.icon} className="size-4" />
            {s.label}
          </Link>
        ))}
      </nav>
      {items.length ? <GameGrid games={items} /> : <p className="text-text-2">Nenhuma oferta nesta página.</p>}
      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => href(sort, p)} />
    </div>
  );
}
