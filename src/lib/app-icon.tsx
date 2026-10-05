import { ImageResponse } from "next/og";

/**
 * Ícone do app (mesma marca do cabeçalho): quadrado verde-limão com a linha de preço caindo.
 * `padding` deixa margem para ícones "maskable" (Android recorta em círculo/squircle).
 */
export function renderAppIcon(size: number, { rounded = true, padding = 0 } = {}) {
  const inner = size - padding * 2;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: padding ? "#b6f03c" : "transparent" }}>
        <div
          style={{
            width: inner,
            height: inner,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#b6f03c",
            borderRadius: rounded && !padding ? inner * 0.18 : 0,
          }}
        >
          <svg width={inner * 0.78} height={inner * 0.78} viewBox="0 0 28 28">
            <path d="M6 9l6 6 3.5-3.5L22 18" fill="none" stroke="#0b0d12" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 12.5V18h-5.5" fill="none" stroke="#0b0d12" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
