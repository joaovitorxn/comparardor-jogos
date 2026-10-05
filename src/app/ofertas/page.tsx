import type { Metadata } from "next";
import { GameGrid } from "@/components/game-card";
import { Pagination, parsePage } from "@/components/pagination";
import { SectionHeader } from "@/components/ui";
import { getDeals } from "@/db/queries";

const PAGE_SIZE = 30;

export const metadata: Metadata = {
  title: "Ofertas",
  description: "Os maiores descontos em jogos agora, comparando Steam, GOG, Epic, Nuuvem, Green Man Gaming e Microsoft Store.",
};

export default async function DealsPage(props: PageProps<"/ofertas">) {
  const page = parsePage((await props.searchParams).pagina);
  const { items, total } = await getDeals({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SectionHeader title="Ofertas" aside={`${total} jogos com desconto · do maior para o menor`} />
      {items.length ? <GameGrid games={items} /> : <p className="text-text-2">Nenhuma oferta nesta página.</p>}
      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => (p === 1 ? "/ofertas" : `/ofertas?pagina=${p}`)} />
    </div>
  );
}
