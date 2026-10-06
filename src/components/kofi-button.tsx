"use client";

import Script from "next/script";

declare global {
  interface Window {
    kofiWidgetOverlay?: { draw: (page: string, options: Record<string, string>) => void };
    __kofiDrawn?: boolean;
  }
}

/** Botão flutuante "Me apoie" (Ko-fi), na cor da marca. O script do Ko-fi só carrega depois da página pronta. */
export function KofiButton() {
  return (
    <Script
      src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
      strategy="lazyOnload"
      onReady={() => {
        // o onReady roda de novo se o componente remontar; o botão só pode ser desenhado uma vez
        if (window.__kofiDrawn || !window.kofiWidgetOverlay) return;
        window.__kofiDrawn = true;
        window.kofiWidgetOverlay.draw("dropou", {
          type: "floating-chat",
          "floating-chat.donateButton.text": "Me apoie",
          "floating-chat.donateButton.background-color": "#b6f03c",
          "floating-chat.donateButton.text-color": "#0b0d12",
        });
      }}
    />
  );
}
