/**
 * Importa exclusivos de PlayStation e Nintendo para o catálogo.
 *   npm run exclusives -- 40   (até 40 jogos novos; padrão 20)
 * Use DOTENV_CONFIG_PATH=.env.turso para o banco de produção.
 */
import "dotenv/config";
import { syncExclusives } from "../src/services/catalog";

const limit = Number(process.argv[2]) || 20;
console.log(await syncExclusives({ limit, scan: Math.max(150, limit * 4) }));
