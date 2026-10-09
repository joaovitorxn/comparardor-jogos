/**
 * Preenche os idiomas de todos os jogos da Steam que ainda não os têm:
 * `DOTENV_CONFIG_PATH=.env.turso npx tsx scripts/languages.mts`. Em produção o robô de preços faz isso aos poucos.
 */
import "dotenv/config";
import { syncLanguages } from "../src/services/catalog";

let total = 0;
for (;;) {
  const n = await syncLanguages({ limit: 100, pauseMs: 1600 });
  total += n;
  console.log(`+${n} (total ${total})`);
  if (n === 0) break;
}
process.exit(0);
