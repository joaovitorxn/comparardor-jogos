/**
 * Atualiza preços de todas as listagens não verificadas recentemente.
 *   npm run refresh                 (listagens com mais de 60 min)
 *   npm run refresh -- --all        (todas)
 *   npm run refresh -- --store gog  (só uma loja)
 */
import "dotenv/config";
import { checkPriceAlerts } from "@/services/alerts";
import { refreshPrices } from "@/services/catalog";

const args = process.argv.slice(2);
const storeIdx = args.indexOf("--store");

const summary = await refreshPrices({
  olderThanMinutes: args.includes("--all") ? 0 : 60,
  store: storeIdx >= 0 ? args[storeIdx + 1] : undefined,
});

if (!Object.keys(summary).length) console.log("Nada para atualizar.");
for (const [store, s] of Object.entries(summary)) {
  const detail =
    store === "itad"
      ? `${s.checked} jogos, ${s.changed} ofertas (Epic, Nuuvem, GMG, Microsoft)`
      : store === "igdb"
        ? `${s.checked} jogos atualizados, ${s.changed} novas ofertas na GOG`
        : store === "pendentes"
          ? `${s.checked} jogos importados pela busca foram completados`
          : `${s.checked} verificados, ${s.changed} com preço novo`;
  console.log(`${store}: ${detail}${s.error ? ` — ERRO: ${s.error}` : ""}`);
}

const alerts = await checkPriceAlerts();
if (alerts.checked) {
  console.log(`alertas: ${alerts.checked} verificados, ${alerts.sent} notificações enviadas, ${alerts.rearmed} rearmados${alerts.removed ? `, ${alerts.removed} aparelhos removidos` : ""}`);
}
