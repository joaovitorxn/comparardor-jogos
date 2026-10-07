/**
 * Resumo dos cliques em links de lojas (tabela clicks): `DOTENV_CONFIG_PATH=.env.turso npx tsx scripts/clicks.mts [dias]`
 * Mostra o total por tipo e por loja e os jogos/produtos mais clicados no período (padrão: 7 dias).
 */
import { createClient } from "@libsql/client";
import "dotenv/config";

const days = Number(process.argv[2]) || 7;
const c = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN });
const since = Math.floor(Date.now() / 1000) - days * 86400;
const q = async (sql: string) => (await c.execute({ sql, args: [since] })).rows;

console.log(`Cliques nos últimos ${days} dias\n`);
console.table(await q("select kind as tipo, store as loja, count(*) as cliques from clicks where created_at >= ? group by kind, store order by cliques desc"));
console.log("Jogos mais clicados (comprar):");
console.table(await q("select g.title as jogo, count(*) as cliques from clicks k join games g on g.id = k.game_id where k.kind = 'buy' and k.created_at >= ? group by k.game_id order by cliques desc limit 10"));
console.log("Gift Cards e Setup:");
console.table(await q("select kind as tipo, target as item, store as loja, count(*) as cliques from clicks where kind in ('giftcard','setup') and created_at >= ? group by kind, target, store order by cliques desc limit 15"));
console.log("Por dia:");
console.table(await q("select date(created_at, 'unixepoch') as dia, count(*) as cliques from clicks where created_at >= ? group by dia order by dia desc"));
process.exit(0);
