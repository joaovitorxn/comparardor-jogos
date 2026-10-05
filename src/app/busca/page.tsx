import { inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { GameCard } from "@/components/game-card";
import { SearchForm } from "@/components/search-form";
import { SteamResultCard } from "@/components/steam-result-card";
import { SectionHeader } from "@/components/ui";
import { searchSteamGames, type SteamStoreItem } from "@/collectors/steam";
import { getGameSummaries } from "@/db/queries";
import { db } from "@/db";
import { games } from "@/db/schema";

export async function generateMetadata(props: PageProps<"/busca">): Promise<Metadata> {
  const { q } = await props.searchParams;
  return { title: typeof q === "string" && q ? `Busca: ${q}` : "Busca", robots: { index: false } };
}

export default async function SearchPage(props: PageProps<"/busca">) {
  const { q: rawQ } = await props.searchParams;
  const q = typeof rawQ === "string" ? rawQ.trim().slice(0, 100) : "";

  const [local, steamResult] = q
    ? await Promise.all([
        getGameSummaries({ q, limit: 40 }),
        searchSteamGames(q).then(
          (items) => ({ items, error: false }),
          () => ({ items: [] as SteamStoreItem[], error: true }),
        ),
      ])
    : [[], { items: [] as SteamStoreItem[], error: false }];

  // jogos da Steam que já estão no catálogo aparecem como resultado local (com todas as lojas)
  const steamIds = steamResult.items.map((s) => s.appId);
  const known = steamIds.length
    ? new Set((await db.select({ id: games.steamAppId }).from(games).where(inArray(games.steamAppId, steamIds))).map((g) => g.id))
    : new Set<number | null>();
  const localIds = new Set(local.map((s) => s.game.steamAppId));
  const fromSteam = steamResult.items.filter((s) => !known.has(s.appId) && !localIds.has(s.appId));

  // jogos do catálogo que a busca da Steam também achou, mas que o filtro local não pegou
  const missingLocal = steamResult.items.filter((s) => known.has(s.appId) && !localIds.has(s.appId)).map((s) => s.appId);
  const extraLocal = await getGameSummaries({ steamAppIds: missingLocal });
  const catalog = [...local, ...extraLocal];
  const total = catalog.length + fromSteam.length;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 lg:px-6">
      <SearchForm defaultValue={q} size="lg" className="max-w-2xl" />

      {!q ? (
        <p className="text-text-2">Digite o nome de um jogo para buscar.</p>
      ) : (
        <section>
          <SectionHeader
            title={total ? `Resultados para “${q}”` : `Nada encontrado para “${q}”`}
            aside={total ? `${total} ${total === 1 ? "jogo" : "jogos"}` : undefined}
          />
          {total > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4 xl:grid-cols-6">
              {catalog.map((s) => (
                <GameCard key={s.game.id} summary={s} />
              ))}
              {fromSteam.map((item) => (
                <SteamResultCard key={item.appId} item={item} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-2">
              {steamResult.error
                ? "Não foi possível consultar as lojas agora. Tente de novo em instantes."
                : "Confira a grafia ou tente só parte do nome."}
            </p>
          )}
          {fromSteam.length > 0 && (
            <p className="mt-4 text-xs text-muted">
              Jogos marcados com “Comparar” ainda não foram consultados nas outras lojas — isso acontece ao abri-los.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
