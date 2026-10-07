/**
 * Consulta o status do Steam Deck de todos os jogos da Steam que ainda não foram consultados (ou estão velhos):
 * `DOTENV_CONFIG_PATH=.env.turso npx tsx scripts/deck.mts`. Em produção o robô de preços faz isso aos poucos.
 */
import "dotenv/config";
import { syncDeckStatus } from "../src/services/catalog";

let total = 0;
for (;;) {
  const n = await syncDeckStatus({ limit: 200 });
  total += n;
  console.log(`+${n} (total ${total})`);
  if (n === 0) break;
}
process.exit(0);
