/**
 * Ícones de traço do site (grade 24×24, mesma espessura em todos), para títulos e termos
 * importantes. Um lugar só: trocar espessura ou estilo aqui muda o site inteiro.
 */
const PATHS = {
  tag: [
    "M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592-5.592a2.41 2.41 0 0 0 0-3.408l-7.71-7.71A2 2 0 0 0 11.172 3H6a3 3 0 0 0-3 3z",
    "M7.5 7.5h.01",
  ],
  flame: ["M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z"],
  coin: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1", "M12 7v1m0 8v1"],
  clock: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 7v5l3 3"],
  store: [
    "M3 21h18",
    "M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4",
    "M5 21V10.85",
    "M19 21V10.85",
    "M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4",
  ],
  cart: ["M4 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0", "M15 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0", "M17 17H6V3H4", "M6 5l14 1-1 7H6"],
  chart: ["M4 19h16", "M4 15l4-6 4 2 4-5 4 4"],
  photo: [
    "M15 8h.01",
    "M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z",
    "M3 16l5-5c.928-.893 2.072-.893 3 0l5 5",
    "M14 14l1-1c.928-.893 2.072-.893 3 0l3 3",
  ],
  book: ["M3 19a9 9 0 0 1 9 0 9 9 0 0 1 9 0", "M3 6a9 9 0 0 1 9 0 9 9 0 0 1 9 0", "M3 6v13", "M12 6v13", "M21 6v13"],
  cpu: [
    "M6 5h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
    "M9 9h6v6H9z",
    "M3 10h2M3 14h2M21 10h-2M21 14h-2M10 3v2M14 3v2M10 21v-2M14 21v-2",
  ],
  users: [
    "M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    "M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2",
    "M16 3.13a4 4 0 0 1 0 7.75",
    "M21 21v-2a4 4 0 0 0-3-3.85",
  ],
  monitor: ["M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z", "M7 20h10", "M9 16v4", "M15 16v4"],
  grid: ["M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
