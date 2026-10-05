import { NextResponse, type NextRequest } from "next/server";
import { parsePlatforms, PLATFORMS_COOKIE, serializePlatforms } from "@/lib/platform-selection";

/**
 * Quem escolheu plataformas vê a home personalizada (/p/playstation-pc), servida em cache por combinação.
 * O endereço no navegador continua "/". Sem escolha, a home normal (estática) segue igual para todos
 * — inclusive para o Google.
 */
export function proxy(request: NextRequest) {
  const platforms = parsePlatforms(request.cookies.get(PLATFORMS_COOKIE)?.value);
  if (!platforms.length) return NextResponse.next();
  return NextResponse.rewrite(new URL(`/p/${serializePlatforms(platforms)}`, request.url));
}

export const config = { matcher: ["/"] };
