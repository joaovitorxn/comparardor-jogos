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
  controller: [
    "M12 5h3.5a5 5 0 0 1 0 10H10l-4.015 4.227a2.3 2.3 0 0 1-3.923-2.035l1.634-8.173A5 5 0 0 1 8.6 5H12z",
    "M14 15l4.07 4.284a2.3 2.3 0 0 0 3.925-2.023l-1.6-8.232",
    "M8 9v2",
  ],
  compass: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M8 16l2-6 6-2-2 6z"],
  az: ["M4 7h8M4 12h6M4 17h4", "M17 5v14", "M14 16l3 3 3-3"],
  shield: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "M9 12l2 2 4-4"],
  doc: ["M7 3h7l5 5v13H7z", "M14 3v5h5", "M10 13h6M10 17h6"],
  bug: [
    "M9 9v-1a3 3 0 0 1 6 0v1",
    "M8 9h8a6 6 0 0 1 1 3v3a5 5 0 0 1-10 0v-3a6 6 0 0 1 1-3",
    "M3 13h4M17 13h4M12 20v-6M4 19l3.35-2M20 19l-3.35-2M4 7l3.75 2.4M20 7l-3.75 2.4",
  ],
  bolt: ["M13 3v7h6l-8 11v-7H5z"],
  trophy: ["M8 21h8", "M12 17v4", "M7 4h10", "M17 4v8a5 5 0 0 1-10 0V4", "M5 7H3v2a3 3 0 0 0 3 3", "M19 7h2v2a3 3 0 0 1-3 3"],
  floor: ["M12 4v12", "M8 12l4 4 4-4", "M5 20h14"],
  star: ["M12 17.75l-6.172 3.245 1.179-6.873-5-4.867 6.9-1 3.086-6.253 3.086 6.253 6.9 1-5 4.867 1.179 6.873z"],
  ticket: ["M15 5v2M15 11v2M15 17v2", "M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"],
  dense: ["M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z"],
  list: ["M9 6h11M9 12h11M9 18h11", "M4.5 6h.01M4.5 12h.01M4.5 18h.01"],
  table: ["M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z", "M3 10h18", "M3 15h18", "M9 10v9"],
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
