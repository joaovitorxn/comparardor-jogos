import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // API, importação sob demanda (um robô não deve disparar importações) e páginas sem valor para a busca
      disallow: ["/api/", "/steam/", "/busca", "/minha-lista", "/aguarde", "/jogo/*/cartao"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
