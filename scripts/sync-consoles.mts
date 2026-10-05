/**
 * Busca Xbox, PlayStation Store e Nintendo eShop para jogos do catálogo que ainda não têm
 * essas lojas (útil depois de adicionar as lojas de console a um catálogo existente).
 * Jogos novos já recebem as lojas de console sozinhos, no complemento da importação.
 *
 *   npm run sync:consoles
 *
 * A PS Store é lida página a página (~1,5s por jogo), então catálogos grandes levam um tempo.
 */
import "dotenv/config";
import { and, eq, inArray, notExists, notLike } from "drizzle-orm";
import { db } from "@/db";
import { games, listings } from "@/db/schema";
import { matchOtherStores, syncConsoleStores, syncItad } from "@/services/catalog";

const CONSOLE_STORES = ["xbox", "psstore", "nintendo"];
const BATCH = 25;

// jogos sem nenhuma oferta de console direta ainda (as da Microsoft Store vindas da ITAD não contam)
const pending = await db
  .select({ id: games.id, title: games.title })
  .from(games)
  .where(
    notExists(
      db
        .select({ id: listings.id })
        .from(listings)
        .where(and(eq(listings.gameId, games.id), inArray(listings.store, CONSOLE_STORES), notLike(listings.storeProductId, "itad:%"))),
    ),
  );
console.log(`${pending.length} jogos para verificar nas lojas de console.`);

const startedAt = Date.now();
let found = 0;
for (let i = 0; i < pending.length; i += BATCH) {
  const batch = pending.slice(i, i + BATCH);
  // Xbox e PS pelos ids do IGDB; Nintendo por título
  found += (await syncConsoleStores(batch.map((g) => g.id))).length;
  for (const game of batch) found += (await matchOtherStores(game)).filter((o) => CONSOLE_STORES.includes(o.store)).length;
  // reaplica a regra do Play Anywhere (some a duplicata da Microsoft Store vinda da ITAD)
  await syncItad({ gameIds: batch.map((g) => g.id), historyLimit: 0 });

  const done = Math.min(i + BATCH, pending.length);
  const perMin = done / ((Date.now() - startedAt) / 60_000);
  console.log(`${done}/${pending.length} — ${found} ofertas de console — ~${Math.ceil((pending.length - done) / Math.max(perMin, 1))} min restantes`);
}
console.log(`Pronto: ${found} ofertas de console em ${Math.round((Date.now() - startedAt) / 60_000)} min.`);
