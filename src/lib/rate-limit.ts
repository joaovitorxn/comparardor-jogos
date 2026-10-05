/**
 * Limite de taxa em memória (janela deslizante). Suficiente para um servidor só;
 * com várias instâncias, trocar por um armazenamento compartilhado (ex.: Redis/Upstash).
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Registra uma tentativa e diz se ela está dentro do limite. */
  take(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => t > now - this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    // limpeza ocasional para o mapa não crescer sem fim
    if (this.hits.size > 10_000) {
      for (const [k, times] of this.hits) if (!times.some((t) => t > now - this.windowMs)) this.hits.delete(k);
    }
    return true;
  }
}
