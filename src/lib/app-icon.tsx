import { ImageResponse } from "next/og";
import { LOGO } from "./brand";

/**
 * Ícone do app (mesma marca do cabeçalho): quadrado verde-limão com a seta caindo e o "drop".
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
          <svg width={inner * 0.84} height={inner * 0.84} viewBox={LOGO.viewBox}>
            <path d={LOGO.arrow} fill="none" stroke="#0b0d12" strokeWidth={LOGO.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
            <path d={LOGO.loot} fill="#0b0d12" />
          </svg>
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
