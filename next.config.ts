import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // As lojas já entregam as imagens em tamanhos adequados e por CDN. Otimizar de novo
    // gastaria a cota de transformações da hospedagem (milhares de capas) sem ganho real.
    unoptimized: true,
    // continuam valendo como lista de domínios permitidos para next/image
    remotePatterns: [
      { protocol: "https", hostname: "**.steamstatic.com" },
      { protocol: "https", hostname: "images.gog-statics.com" },
      { protocol: "https", hostname: "images.igdb.com", pathname: "/igdb/image/upload/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        // o navegador precisa sempre da versão mais nova do service worker
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
