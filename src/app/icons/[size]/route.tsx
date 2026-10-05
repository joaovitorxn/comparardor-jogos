import { renderAppIcon } from "@/lib/app-icon";

const SIZES = [96, 192, 512] as const;

// gerados no build: /icons/96 (badge das notificações), /icons/192 e /icons/512 (manifest)
export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}
export const dynamicParams = false;

export async function GET(_req: Request, ctx: RouteContext<"/icons/[size]">) {
  const { size } = await ctx.params;
  const n = Number(size);
  // a versão 512 também serve como "maskable": com margem para o recorte do Android
  return renderAppIcon(n, n === 512 ? { padding: 64 } : {});
}
