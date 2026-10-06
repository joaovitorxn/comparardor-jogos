/**
 * Pré-carrega o catálogo com os jogos mais populares, para que a maioria das buscas
 * já encontre o jogo com todas as lojas. Pode ser interrompido e rodado de novo:
 * jogos que já estão no catálogo são pulados.
 *
 *   npm run seed                  (até 500 jogos)
 *   npm run seed -- --limit 3000
 *   npm run seed -- --topsellers 2000     (os 2.000 mais vendidos da Steam que ainda não estão no catálogo)
 *
 * A Steam aceita ~200 consultas de detalhes a cada 5 minutos, então o ritmo é de
 * ~35 jogos/minuto: 3.000 jogos levam cerca de 1h30.
 */
import "dotenv/config";
import { inArray } from "drizzle-orm";
import { HttpError } from "@/collectors/http";
import { fetchPopularSteamAppIds, isItadConfigured } from "@/collectors/itad";
import { fetchMostPlayedAppIds, fetchTopSellerAppIds, getSteamStoreItems } from "@/collectors/steam";
import { db } from "@/db";
import { games, type Game } from "@/db/schema";
import { enrichGames, importSteamGameBasic, NotAGameError } from "@/services/catalog";

const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : 500;
const topIdx = args.indexOf("--topsellers");
const topSellers = topIdx >= 0 ? Number(args[topIdx + 1]) : 0;

const STEAM_INTERVAL_MS = 1600; // ~187 consultas a cada 5 min, abaixo do limite da Steam
const BATCH = 25; // a cada 25 jogos importados, completa o lote com as outras lojas

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 1. candidatos: populares na ITAD + mais jogados agora na Steam, sem repetir
console.log("Montando a lista de jogos populares…");
const [popular, mostPlayed, sellers] = await Promise.all([
  isItadConfigured() && !topSellers ? fetchPopularSteamAppIds(limit) : Promise.resolve([]),
  fetchMostPlayedAppIds().catch(() => [] as number[]),
  topSellers ? fetchTopSellerAppIds(topSellers) : Promise.resolve([]),
]);
const candidates = [...new Set([...mostPlayed, ...sellers, ...popular])];

// 2. tira o que já está no catálogo
const existing = new Set<number | null>();
for (let i = 0; i < candidates.length; i += 500) {
  const rows = await db.select({ id: games.steamAppId }).from(games).where(inArray(games.steamAppId, candidates.slice(i, i + 500)));
  rows.forEach((r) => existing.add(r.id));
}
let pending = candidates.filter((id) => !existing.has(id));

// 3. só jogos (a lista de "mais jogados" inclui programas como o Wallpaper Engine)
const items = await getSteamStoreItems(pending);
// com --topsellers, importa todos os que faltam; sem ele, completa até `limit`
pending = pending.filter((id) => items.get(id)?.isGame).slice(0, topSellers ? pending.length : Math.max(0, limit - existing.size));

console.log(`${candidates.length} candidatos, ${existing.size} já no catálogo, ${pending.length} para importar.`);

// 4. importa no ritmo que a Steam aceita, completando em lotes
let imported = 0;
let failed = 0;
let batch: Game[] = [];
const startedAt = Date.now();

async function flush() {
  if (!batch.length) return;
  process.stdout.write(`  completando ${batch.length} jogos com as outras lojas… `);
  await enrichGames(batch);
  console.log("ok");
  batch = [];
}

for (const appId of pending) {
  for (let attempt = 0; ; attempt++) {
    try {
      const game = await importSteamGameBasic(appId);
      batch.push(game);
      imported++;
      break;
    } catch (err) {
      if (err instanceof NotAGameError) break;
      // limite da Steam: espera a janela esvaziar e tenta de novo
      if (err instanceof HttpError && err.status === 429 && attempt < 3) {
        console.log("  limite da Steam atingido, aguardando 60s…");
        await sleep(60_000);
        continue;
      }
      failed++;
      console.warn(`  ✗ ${appId}: ${err instanceof Error ? err.message : err}`);
      break;
    }
  }

  const done = imported + failed;
  if (done % 10 === 0) {
    const perMin = done / ((Date.now() - startedAt) / 60_000);
    const eta = Math.ceil((pending.length - done) / Math.max(perMin, 1));
    console.log(`${done}/${pending.length} (${imported} ok, ${failed} falhas) — ~${eta} min restantes`);
  }
  if (batch.length >= BATCH) await flush();
  await sleep(STEAM_INTERVAL_MS);
}
await flush();

console.log(`Pronto: ${imported} jogos importados, ${failed} falhas, em ${Math.round((Date.now() - startedAt) / 60_000)} min.`);
