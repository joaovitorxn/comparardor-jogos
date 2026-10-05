import type { Metadata } from "next";
import Link from "next/link";
import { GameGrid } from "@/components/game-card";
import { Pagination, parsePage } from "@/components/pagination";
import { SectionHeader } from "@/components/ui";
import { getCatalog, type CatalogSort } from "@/db/queries";

const PAGE_SIZE = 30;
const SORTS: { id: CatalogSort; label: string }[] = [
  { id: "recentes", label: "Adicionados recentemente" },
  { id: "az", label: "A–Z" },
];

export const metadata: Metadata = { title: "Catálogo", description: "Todos os jogos com preços comparados entre lojas." };

export default async function CatalogPage(props: PageProps<"/jogos">) {
  const params = await props.searchParams;
  const page = parsePage(params.pagina);
  const sort: CatalogSort = params.ordem === "az" ? "az" : "recentes";
  const { items, total } = await getCatalog({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE, sort });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const href = (p: number, s: CatalogSort = sort) => {
    const qs = new URLSearchParams();
    if (s !== "recentes") qs.set("ordem", s);
    if (p > 1) qs.set("pagina", String(p));
    return qs.size ? `/jogos?${qs}` : "/jogos";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
      <SectionHeader
        title="Catálogo"
        aside={
          <span className="flex items-center gap-3">
            <span>{total} jogos</span>
            <span className="flex rounded-[4px] border border-line bg-bg p-0.5">
              {SORTS.map((s) => (
                <Link
                  key={s.id}
                  href={href(1, s.id)}
                  aria-current={s.id === sort ? "true" : undefined}
                  className={`rounded-[3px] px-2 py-0.5 ${s.id === sort ? "bg-surface-3 text-text" : "hover:text-text"}`}
                >
                  {s.label}
                </Link>
              ))}
            </span>
          </span>
        }
      />
      <GameGrid games={items} />
      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => href(p)} />
    </div>
  );
}
