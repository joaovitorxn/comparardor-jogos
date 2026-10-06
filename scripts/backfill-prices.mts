/**
 * Copia o último snapshot de cada oferta para as colunas de preço atual da própria oferta (listings.price_*).
 *   npx tsx scripts/backfill-prices.mts            (confere, não muda nada)
 *   npx tsx scripts/backfill-prices.mts --apply    (corrige o que estiver diferente)
 * É idempotente. Use DOTENV_CONFIG_PATH=.env.turso para o banco de produção.
 */
import "dotenv/config";
import { createClient } from "@libsql/client";

const apply = process.argv.includes("--apply");
const c = createClient({ url: process.env.DATABASE_URL ?? "file:./data/app.db", authToken: process.env.DATABASE_AUTH_TOKEN });

// ofertas cujas colunas não batem com o último snapshot (ou ainda estão vazias)
const MISMATCH = `
  from listings l
  join price_snapshots s on s.id = (select max(s2.id) from price_snapshots s2 where s2.listing_id = l.id)
  where l.price_snapshot_id is not s.id or l.price_cents is not s.price_cents or l.price_regular_cents is not s.regular_price_cents
     or l.price_discount_percent is not s.discount_percent or l.price_currency is not s.currency or l.price_captured_at is not s.captured_at`;

const [{ n: before }] = (await c.execute(`select count(*) n ${MISMATCH}`)).rows as unknown as { n: number }[];
const [{ n: total }] = (await c.execute("select count(*) n from listings").then((r) => r.rows)) as unknown as { n: number }[];
const [{ n: orphan }] = (await c.execute("select count(*) n from listings l where l.price_snapshot_id is not null and not exists (select 1 from price_snapshots s where s.id = l.price_snapshot_id)").then((r) => r.rows)) as unknown as { n: number }[];
console.log(`${total} ofertas; ${before} com preço diferente do último snapshot; ${orphan} apontando para snapshot inexistente`);

if (apply && (before > 0 || orphan > 0)) {
  await c.execute(`update listings set
      price_snapshot_id = (select s.id from price_snapshots s where s.id = (select max(s2.id) from price_snapshots s2 where s2.listing_id = listings.id)),
      price_currency = (select s.currency from price_snapshots s where s.id = (select max(s2.id) from price_snapshots s2 where s2.listing_id = listings.id)),
      price_cents = (select s.price_cents from price_snapshots s where s.id = (select max(s2.id) from price_snapshots s2 where s2.listing_id = listings.id)),
      price_regular_cents = (select s.regular_price_cents from price_snapshots s where s.id = (select max(s2.id) from price_snapshots s2 where s2.listing_id = listings.id)),
      price_discount_percent = (select s.discount_percent from price_snapshots s where s.id = (select max(s2.id) from price_snapshots s2 where s2.listing_id = listings.id)),
      price_captured_at = (select s.captured_at from price_snapshots s where s.id = (select max(s2.id) from price_snapshots s2 where s2.listing_id = listings.id))
    where exists (select 1 from price_snapshots s where s.listing_id = listings.id)`);
  const [{ n: after }] = (await c.execute(`select count(*) n ${MISMATCH}`)).rows as unknown as { n: number }[];
  console.log(`depois: ${after} diferentes`);
}
