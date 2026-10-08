import { unstable_cache } from "next/cache";
import sharp from "sharp";

/** Brilho médio (0–255) acima do qual o lado direito da arte é claro demais para o banner escuro do site... */
export const LIGHT_THRESHOLD = 150;
/** ...mas só conta se for uma área lisa (variação baixa): céu claro e neve cheios de detalhe ficam bem no banner. */
export const FLAT_MAX_STD = 45;

export interface SideStats {
  mean: number;
  std: number;
}

/** Brilho médio e variação (0–255) da faixa da direita da imagem (por padrão, os 40% finais da largura). */
export async function rightSideStats(image: Buffer, share = 0.4): Promise<SideStats> {
  const { data, info } = await sharp(image).resize(96, 36, { fit: "fill" }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const from = Math.floor(info.width * (1 - share));
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = from; x < info.width; x++) {
      const v = data[y * info.width + x];
      sum += v;
      sumSq += v * v;
      count++;
    }
  }
  const mean = sum / count;
  return { mean, std: Math.sqrt(Math.max(0, sumSq / count - mean * mean)) };
}

export const isLightSide = ({ mean, std }: SideStats) => mean > LIGHT_THRESHOLD && std < FLAT_MAX_STD;

/** Baixa a imagem e diz se o lado direito é claro. Erro de rede lança (assim a falha não fica guardada no cache). */
async function analyze(url: string): Promise<boolean> {
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`imagem ${res.status}`);
  return isLightSide(await rightSideStats(Buffer.from(await res.arrayBuffer())));
}

/**
 * Algumas artes do banner (a "library hero" da Steam) têm o desenho de um lado e um degradê branco do outro, o que fica
 * estranho no banner escuro. O resultado vale para sempre para aquela imagem, então fica em cache por 30 dias.
 */
export const isLightHero = unstable_cache(analyze, ["hero-light-v1"], { revalidate: 60 * 60 * 24 * 30 });
