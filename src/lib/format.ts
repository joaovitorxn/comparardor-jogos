const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatCents(cents: number, currency = "BRL"): string {
  if (currency === "BRL") return brl.format(cents / 100);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

const hoursFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Duração em segundos → "45 min", "21,5 h", "132 h". */
export function formatDuration(seconds: number): string {
  if (seconds < 3600) return `${Math.max(1, Math.round(seconds / 60))} min`;
  const hours = seconds / 3600;
  // meia hora de precisão abaixo de 20h; acima disso, hora cheia
  return `${hoursFmt.format(hours < 20 ? Math.round(hours * 2) / 2 : Math.round(hours))} h`;
}

const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export function formatRelative(date: Date, now = new Date()): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(seconds, "second");
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86400), "day");
}
