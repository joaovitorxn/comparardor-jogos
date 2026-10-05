const USER_AGENT = "dropou/0.1 (+https://dropou.com.br)";

export class HttpError extends Error {
  readonly url: string;

  constructor(
    public status: number,
    rawUrl: string,
  ) {
    // nunca vazar chaves de API em logs
    const url = rawUrl.replace(/([?&]key=)[^&]+/, "$1***");
    super(`HTTP ${status} em ${url}`);
    this.url = url;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** fetch com timeout e retry para 429/5xx — as APIs das lojas limitam requisições. */
export async function fetchJson<T>(
  url: string,
  { retries = 2, timeoutMs = 15000, init = {} }: { retries?: number; timeoutMs?: number; init?: RequestInit } = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...init.headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.ok) return (await res.json()) as T;
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= retries) throw new HttpError(res.status, url);
    await sleep(1000 * 2 ** attempt);
  }
}
