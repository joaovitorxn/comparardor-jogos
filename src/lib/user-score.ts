/** Etiqueta e tom das avaliações dos jogadores, no mesmo critério da Steam (percentual de positivas e volume de avaliações). */
export interface UserScoreInfo {
  label: string;
  tone: "good" | "mixed" | "bad";
}

/** Poucas avaliações: o percentual ainda não diz muito, então não ganha etiqueta. */
export const MIN_REVIEWS_FOR_LABEL = 10;

export function userScoreInfo(percent: number, count: number): UserScoreInfo | null {
  if (count < MIN_REVIEWS_FOR_LABEL) return null;
  if (percent >= 95 && count >= 500) return { label: "Extremamente positivas", tone: "good" };
  if (percent >= 80 && count >= 50) return { label: "Muito positivas", tone: "good" };
  if (percent >= 80) return { label: "Positivas", tone: "good" };
  if (percent >= 70) return { label: "Majoritariamente positivas", tone: "good" };
  if (percent >= 40) return { label: "Mistas", tone: "mixed" };
  if (percent >= 20) return { label: "Majoritariamente negativas", tone: "bad" };
  if (count >= 500) return { label: "Extremamente negativas", tone: "bad" };
  if (count >= 50) return { label: "Muito negativas", tone: "bad" };
  return { label: "Negativas", tone: "bad" };
}
