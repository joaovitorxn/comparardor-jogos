import { userScoreInfo } from "@/lib/user-score";
import { Icon } from "./icon";

const TONES = {
  good: "border-accent-line bg-accent-soft text-accent",
  mixed: "border-warn-line bg-warn-soft text-warn",
  bad: "border-danger/40 bg-danger/10 text-danger",
} as const;

const number = new Intl.NumberFormat("pt-BR");
export const formatReviewCount = (n: number) => number.format(n);

/** Avaliações dos jogadores na Steam: percentual de positivas num selo colorido e a etiqueta ("Muito positivas") embaixo. */
export function UserScoreBadge({ percent, count }: { percent: number; count: number }) {
  const info = userScoreInfo(percent, count);
  const tone = info?.tone ?? "mixed";
  return (
    <span className="flex flex-col items-end gap-0.5" title={`${percent}% das ${formatReviewCount(count)} avaliações dos jogadores na Steam são positivas`}>
      <span className={`tabular inline-flex h-9 items-center rounded-[4px] border px-2.5 font-display text-lg font-bold ${TONES[tone]}`}>{percent}%</span>
      {info && <span className="whitespace-nowrap text-xs text-text-2">{info.label}</span>}
    </span>
  );
}

const FILLS = { good: "bg-accent", mixed: "bg-warn", bad: "bg-danger" } as const;
const TEXTS = { good: "text-accent", mixed: "text-warn", bad: "text-danger" } as const;

/**
 * Versão discreta do topo da página do jogo, na linha do desenvolvedor e da data: ícone, percentual, uma barrinha fina de
 * 0 a 100% e o texto ("Muito positivas · N avaliações na Steam"). Só o percentual e a barra têm cor.
 */
export function UserScoreInline({ percent, count }: { percent: number; count: number }) {
  const info = userScoreInfo(percent, count);
  const tone = info?.tone ?? "mixed";
  const value = Math.min(100, Math.max(0, percent));
  return (
    <span
      className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
      title={`${percent}% das ${formatReviewCount(count)} avaliações dos jogadores na Steam são positivas`}
    >
      <Icon name="thumbsUp" className={`size-4 shrink-0 ${TEXTS[tone]}`} />
      <span className={`tabular font-display text-lg font-bold leading-none ${TEXTS[tone]}`}>{percent}%</span>
      <span
        role="meter"
        aria-label="Avaliações positivas dos jogadores"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-1 w-14 shrink-0 overflow-hidden rounded-full bg-text/20"
      >
        <span className={`block h-full rounded-full ${FILLS[tone]}`} style={{ width: `${value}%` }} />
      </span>
      <span className="text-xs text-text-2">
        {info ? `${info.label} · ` : ""}
        {formatReviewCount(count)} avaliações na Steam
      </span>
    </span>
  );
}
