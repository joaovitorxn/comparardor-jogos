/**
 * A Steam guarda cada arte em duas versões: "_2x" (o dobro do tamanho) e a normal. A normal tem um terço do
 * peso (capa 75 KB contra 226 KB; arte larga 474 KB contra 1,4 MB) e continua nítida no tamanho em que o
 * site mostra. Outras lojas passam sem mudança.
 */
export function lightImage(url: string): string;
export function lightImage(url: string | null | undefined): string | null;
export function lightImage(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace("/library_600x900_2x.jpg", "/library_600x900.jpg").replace("/library_hero_2x.jpg", "/library_hero.jpg");
}
