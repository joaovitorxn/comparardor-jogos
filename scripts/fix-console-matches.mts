/**
 * Remove ofertas da Nintendo que são de OUTRO jogo com o mesmo título (ex.: "Resident Evil 4" de 2005 x o
 * remake de 2023), usando a data de lançamento da eShop.
 *   npx tsx scripts/fix-console-matches.mts          (só mostra)
 *   npx tsx scripts/fix-console-matches.mts --apply  (remove)
 * Use DOTENV_CONFIG_PATH=.env.turso para o banco de produção.
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { nintendoCollector } from "../src/collectors/nintendo";
import { db } from "../src/db";
import { games, listings } from "../src/db/schema";
import { isDifferentGame, parseReleaseDate } from "../src/lib/release-date";

const apply = process.argv.includes("--apply");
const rows = await db
  .select({ id: listings.id, gameId: listings.gameId, productId: listings.storeProductId, title: games.title, release: games.releaseDate, platforms: games.platforms, platform: listings.platform })
  .from(listings)
  .innerJoin(games, eq(games.id, listings.gameId))
  .where(and(eq(listings.store, "nintendo")));

let removed = 0;
for (const row of rows) {
  const offers = await nintendoCollector.findByTitle(row.title).catch(() => []);
  const offer = offers.find((o) => o.storeProductId === row.productId);
  if (!offer) continue;
  if (!isDifferentGame({ release: parseReleaseDate(row.release), platforms: row.platforms }, { platform: row.platform, releasedAt: offer.releasedAt })) continue;
  console.log(`${apply ? "removendo" : "removeria"}: ${row.title} (${row.release}) ← Nintendo "${offer.title}" lançado em ${offer.releasedAt?.toISOString().slice(0, 10)}`);
  if (apply) await db.delete(listings).where(eq(listings.id, row.id));
  removed++;
}
console.log(`${rows.length} ofertas da Nintendo verificadas, ${removed} ${apply ? "removidas" : "para remover"}.`);
