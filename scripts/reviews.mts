/**
 * Consulta as avaliações dos jogadores (Steam) de todos os jogos que ainda não foram consultados (ou estão velhos):
 * `DOTENV_CONFIG_PATH=.env.turso npx tsx scripts/reviews.mts`. Em produção o robô de preços atualiza aos poucos.
 */
import "dotenv/config";
import { syncUserReviews } from "../src/services/catalog";

let total = 0;
for (;;) {
  const n = await syncUserReviews({ limit: 200 });
  total += n;
  console.log(`+${n} (total ${total})`);
  if (n === 0) break;
}
process.exit(0);
