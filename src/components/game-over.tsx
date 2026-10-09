/**
 * Ilustração da página 404: "GAME OVER" em pixel art, com o cursor piscando no fim, como numa tela de fliperama.
 * Cada letra é uma grade de 5x7 quadradinhos pintados com as cores do site.
 */
const GLYPHS: Record<string, string[]> = {
  G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".###."],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
};

const GLYPH_W = 5;
const GAP = 1;
const LINE_H = 7;
const LINE_GAP = 2;

/** Quadradinhos de uma palavra, começando em (0, y). */
function word(text: string, y: number) {
  const dots: { x: number; y: number }[] = [];
  [...text].forEach((ch, i) => {
    GLYPHS[ch].forEach((row, dy) => {
      [...row].forEach((c, dx) => {
        if (c === "#") dots.push({ x: i * (GLYPH_W + GAP) + dx, y: y + dy });
      });
    });
  });
  return dots;
}

const FIRST = word("GAME", 0);
const SECOND = word("OVER", LINE_H + LINE_GAP);
// o cursor fica na linha de base da segunda palavra, depois da última letra
const CURSOR_X = 4 * (GLYPH_W + GAP) + 1;
const CURSOR_Y = LINE_H + LINE_GAP + LINE_H - 2;

function Dots({ dots, fill, dx = 0, dy = 0 }: { dots: { x: number; y: number }[]; fill: string; dx?: number; dy?: number }) {
  return (
    <g fill={fill}>
      {dots.map((d) => (
        <rect key={`${d.x}-${d.y}`} x={d.x + dx} y={d.y + dy} width={1} height={1} />
      ))}
    </g>
  );
}

export function GameOver({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 19" role="img" aria-label="Game over" shapeRendering="crispEdges" className={className}>
      {/* sombra de um quadradinho, para as letras ficarem grossas como num fliperama */}
      <Dots dots={FIRST} fill="var(--line-strong)" dx={1} dy={1} />
      <Dots dots={SECOND} fill="var(--line-strong)" dx={1} dy={1} />
      <Dots dots={FIRST} fill="var(--text)" />
      <Dots dots={SECOND} fill="var(--accent)" />
      <rect className="cursor-blink" x={CURSOR_X} y={CURSOR_Y} width={3} height={2} fill="var(--accent)" />
    </svg>
  );
}
