/**
 * Consulta as avaliações dos jogadores (Steam) de todos os jogos que ainda não foram consultados (ou estão velhos):
 * `DOTENV_CONFIG_PATH=.env.turso npx tsx scripts/reviews.mts`. A Steam aceita ~200 consultas por 5 minutos; se bloquear,
 * o script espera 6 minutos e continua. Em produção o robô de preços atualiza aos poucos.
 */
import "dotenv/config";
import { syncUserReviews } from "../src/services/catalog";

let total = 0;
for (;;) {
  const { checked, blocked, remaining } = await syncUserReviews({ limit: 150, pauseMs: 1600 });
  total += checked;
  console.log(`+${checked} (total ${total}, faltam ${remaining}${blocked ? ", bloqueado pela Steam: espera 6 min" : ""})`);
  if (remaining <= 0 || (checked === 0 && !blocked)) break;
  if (blocked) await new Promise((r) => setTimeout(r, 6 * 60_000));
}
process.exit(0);
