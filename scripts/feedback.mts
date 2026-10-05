/** Lista os últimos feedbacks: `npm run feedback` (use DOTENV_CONFIG_PATH=.env.turso para os de produção). */
import "dotenv/config";
import { desc } from "drizzle-orm";
import { db } from "../src/db";
import { feedback } from "../src/db/schema";

const rows = await db.select().from(feedback).orderBy(desc(feedback.createdAt)).limit(Number(process.argv[2]) || 30);
if (!rows.length) console.log("Nenhum feedback ainda.");
for (const f of rows) {
  console.log(`\n#${f.id} · ${f.kind} · ${f.createdAt.toLocaleString("pt-BR")} · ${f.page ?? "?"}${f.contact ? ` · ${f.contact}` : ""}\n${f.message}`);
}
