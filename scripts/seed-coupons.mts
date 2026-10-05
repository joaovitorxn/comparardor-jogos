/**
 * Cupons de EXEMPLO para desenvolver a interface — não são códigos reais.
 * Na fase de cupons, isso vira curadoria manual + envio pela comunidade.
 */
import "dotenv/config";
import { db } from "@/db";
import { coupons } from "@/db/schema";

const inDays = (d: number) => new Date(Date.now() + d * 86_400_000);

await db.delete(coupons);
await db.insert(coupons).values([
  {
    store: "gog",
    code: "EXEMPLO10",
    description: "10% em jogos sem desconto (exemplo)",
    kind: "percent",
    value: 10,
    stacksWithSale: false,
    expiresAt: inDays(30),
  },
  {
    store: "steam",
    code: null,
    description: "R$ 5 de volta em compras acima de R$ 40 (exemplo)",
    kind: "fixed",
    value: 500,
    minPurchaseCents: 4000,
    expiresAt: inDays(7),
  },
]);

console.log("Cupons de exemplo criados.");
