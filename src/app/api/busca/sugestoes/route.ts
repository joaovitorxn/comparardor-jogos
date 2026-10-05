import type { NextRequest } from "next/server";
import { PLATFORM_FAMILIES, type PlatformFamilyId } from "@/lib/stores";
import { suggest } from "@/services/search";

const FAMILY_IDS = new Set<string>(PLATFORM_FAMILIES.map((f) => f.id));

/** Sugestões do autocompletar: `?q=hollw&plataforma=pc` → até 3 jogos com capa e preço. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = (params.get("q") ?? "").slice(0, 80);
  const platform = params.get("plataforma");
  const suggestions = await suggest(q, { platform: platform && FAMILY_IDS.has(platform) ? (platform as PlatformFamilyId) : undefined });
  return Response.json(
    { suggestions },
    // chamado a cada tecla: a CDN responde as consultas repetidas por um minuto
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
