import Image from "next/image";
import Link from "next/link";
import { igdbImageUrl } from "@/collectors/igdb";
import type { SimilarGameView } from "@/db/queries";
import { PriceText } from "./ui";

export function SimilarGames({ games }: { games: SimilarGameView[] }) {
  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
      {games.slice(0, 10).map((g) => {
        // fora do catálogo, a busca oferece adicionar o jogo pela Steam
        const href = g.slug ? `/jogo/${g.slug}` : `/busca?q=${encodeURIComponent(g.name)}`;
        return (
          <li key={g.igdbId}>
            <Link href={href} className="group flex flex-col gap-2">
              <span className="relative aspect-[3/4] overflow-hidden rounded-[4px] border border-line bg-surface-2 transition group-hover:border-accent-line">
                {g.coverImageId ? (
                  <Image
                    src={igdbImageUrl(g.coverImageId)}
                    alt={`Capa de ${g.name}`}
                    fill
                    sizes="(min-width: 1024px) 160px, 30vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-end p-2 text-xs font-semibold text-muted">{g.name}</span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium group-hover:text-accent" title={g.name}>
                  {g.name}
                </span>
                <span className="block text-xs text-muted">
                  {g.bestPriceCents != null ? <PriceText cents={g.bestPriceCents} className="font-semibold text-text" /> : g.slug ? "No catálogo" : "Buscar preço"}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
