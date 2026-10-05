/**
 * Endereço público do site. Na Vercel, é o domínio de produção do projeto; senão, o endereço local.
 * Usado no sitemap, nos links canônicos e nos dados estruturados.
 */
export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
