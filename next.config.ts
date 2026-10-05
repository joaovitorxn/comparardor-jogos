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
};

export default nextConfig;
