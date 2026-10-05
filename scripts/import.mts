/**
 * Importa jogos da Steam e procura o mesmo jogo nas outras lojas.
 *   npm run import -- 367520 1145360        (por appid)
 *   npm run import -- "hollow knight"       (por nome — usa o primeiro resultado)
 *   npm run import -- --all                 (reimporta todo o catálogo: metadados, mídia e lojas)
 */
import "dotenv/config";
import { isNotNull } from "drizzle-orm";
import { searchSteam } from "@/collectors/steam";
import { db } from "@/db";
import { games } from "@/db/schema";
import { importSteamGame } from "@/services/catalog";
import { normalizeTitle } from "@/lib/text";

async function resolveAppId(arg: string): Promise<number | null> {
  if (/^\d+$/.test(arg)) return Number(arg);
  const results = await searchSteam(arg);
  const exact = results.find((r) => normalizeTitle(r.name) === normalizeTitle(arg));
  const pick = exact ?? results[0];
  if (pick) console.log(`"${arg}" → ${pick.name} (${pick.appId})`);
  return pick?.appId ?? null;
}

let args = process.argv.slice(2);
if (args.includes("--all")) {
  const rows = await db.select({ appId: games.steamAppId }).from(games).where(isNotNull(games.steamAppId));
  args = rows.map((r) => String(r.appId));
}
if (!args.length) {
  console.error('Uso: npm run import -- <appid | "nome do jogo" | --all> [...]');
  process.exit(1);
}

for (const arg of args) {
  const appId = await resolveAppId(arg);
  if (!appId) {
    console.warn(`Nada encontrado na Steam para "${arg}"`);
    continue;
  }
  try {
    const { game, matched } = await importSteamGame(appId);
    const others = matched.map((m) => m.store).join(", ") || "nenhuma outra loja";
    console.log(`✓ ${game.title} → /jogo/${game.slug} (também em: ${others})`);
  } catch (err) {
    console.error(`✗ ${appId}:`, err instanceof Error ? err.message : err);
  }
}
