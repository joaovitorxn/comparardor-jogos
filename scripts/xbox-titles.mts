/**
 * Procura na loja Xbox, pelo título, os jogos que o IGDB diz serem de Xbox mas que ficaram sem oferta (o IGDB ainda
 * não tinha o código da loja). Sem --apply só mostra o que encontraria; com --apply grava as ofertas.
 * `DOTENV_CONFIG_PATH=.env.turso npx tsx scripts/xbox-titles.mts [--apply]`
 */
import { createClient } from "@libsql/client";
import "dotenv/config";
import { xboxCollector } from "../src/collectors/xbox";
import { normalizeTitle } from "../src/lib/text";
import { matchOtherStores } from "../src/services/catalog";

const apply = process.argv.includes("--apply");
const c = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN });
const rows = (
  await c.execute(
    "select g.id, g.title from games g where g.platforms like '%Xbox%' and not exists (select 1 from listings l where l.game_id=g.id and l.store='xbox' and l.available=1) order by g.id",
  )
).rows as unknown as { id: number; title: string }[];
console.log(`${rows.length} jogos de Xbox sem oferta${apply ? " (gravando)" : " (simulação)"}`);

let found = 0;
const missed: string[] = [];
for (const [i, r] of rows.entries()) {
  try {
    if (apply) {
      const saved = await matchOtherStores({ id: r.id, title: r.title }, { only: ["xbox"] });
      if (saved.length) found++;
      else missed.push(r.title);
    } else {
      const offers = await xboxCollector.findByTitle(r.title);
      if (offers.some((o) => normalizeTitle(o.title) === normalizeTitle(r.title))) found++;
      else missed.push(r.title);
    }
  } catch (err) {
    console.warn("erro:", r.title, String(err).slice(0, 80));
  }
  if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${rows.length} · achados ${found}`);
  await new Promise((s) => setTimeout(s, 300));
}
console.log(`achados: ${found}/${rows.length}`);
console.log("sem correspondência (amostra):", missed.slice(0, 25).join(" | "));
process.exit(0);
