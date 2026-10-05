import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after, type NextRequest } from "next/server";
import { steamStoreUrl } from "@/collectors/steam";
import { db } from "@/db";
import { games } from "@/db/schema";
import { RateLimiter } from "@/lib/rate-limit";
import { enrichGame, importSteamGameBasic, NotAGameError } from "@/services/catalog";

// o complemento em segundo plano (after) leva alguns segundos
export const maxDuration = 60;

// importações novas por visitante, e no total — a API da Steam aceita ~200 consultas a cada 5 min
const perVisitor = new RateLimiter(20, 10 * 60_000);
const everyone = new RateLimiter(100, 10 * 60_000);

/**
 * Entrada para jogos que ainda não estão no catálogo (resultados da busca).
 * Importa o básico da Steam, agenda o resto e redireciona para a página do jogo.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/steam/[appid]">) {
  const { appid } = await ctx.params;
  const appId = Number(appid);
  if (!Number.isInteger(appId) || appId <= 0) redirect("/");

  const [existing] = await db.select({ slug: games.slug }).from(games).where(eq(games.steamAppId, appId));
  if (existing) redirect(`/jogo/${existing.slug}`);

  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!perVisitor.take(visitor) || !everyone.take("all")) redirect("/aguarde");

  let slug: string;
  try {
    const game = await importSteamGameBasic(appId);
    slug = game.slug;
    after(async () => {
      await enrichGame(game);
      revalidatePath(`/jogo/${game.slug}`);
      revalidatePath("/");
    });
  } catch (err) {
    // DLC, demo, trilha sonora ou app removido: não entra no catálogo
    if (err instanceof NotAGameError) redirect(steamStoreUrl(appId));
    console.error(`[steam] falha ao importar ${appId}:`, err);
    redirect("/aguarde?erro=1");
  }
  redirect(`/jogo/${slug}`);
}
