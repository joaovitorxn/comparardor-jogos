import type { NextRequest } from "next/server";
import { parsePlatforms } from "@/lib/platform-selection";
import { suggest } from "@/services/search";

/** Sugestões do autocompletar: `?q=hollw&plataformas=pc,playstation` → até 3 jogos com capa e preço. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = (params.get("q") ?? "").slice(0, 80);
  const suggestions = await suggest(q, { platforms: parsePlatforms(params.get("plataformas")) });
  return Response.json(
    { suggestions },
    // chamado a cada tecla: a CDN responde as consultas repetidas por um minuto
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
