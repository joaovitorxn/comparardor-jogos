import type { MetadataRoute } from "next";

// Permite instalar o site na tela inicial — no iPhone, é o que libera as notificações de alerta.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "comparador.jogos — o menor preço de cada jogo",
    short_name: "comparador",
    description: "Compare preços de jogos entre lojas e receba alertas quando baixarem.",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d12",
    theme_color: "#0b0d12",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
