export interface AlertState {
  thresholdCents: number;
  lastNotifiedCents: number | null;
}

export type AlertDecision =
  | { action: "notify" }
  /** O preço subiu acima do alvo: o alerta volta a valer para a próxima queda. */
  | { action: "rearm" }
  | { action: "none" };

/**
 * Decide o que fazer com um alerta diante do menor preço atual.
 * - Avisa quando o preço chega ao alvo, e de novo só se cair ainda mais (sem repetir o mesmo aviso).
 * - Se o preço volta a ficar acima do alvo, o alerta é rearmado para a próxima promoção.
 */
export function decideAlert(alert: AlertState, bestCents: number | null): AlertDecision {
  if (bestCents == null) return { action: "none" };
  if (bestCents > alert.thresholdCents) {
    return alert.lastNotifiedCents != null ? { action: "rearm" } : { action: "none" };
  }
  if (alert.lastNotifiedCents == null || bestCents < alert.lastNotifiedCents) return { action: "notify" };
  return { action: "none" };
}

/** Alvo do tipo "qualquer promoção": qualquer centavo abaixo do preço de quando o alerta foi criado. */
export function saleThreshold(baselineCents: number) {
  return Math.max(0, baselineCents - 1);
}
