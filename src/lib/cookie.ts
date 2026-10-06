/** Grava um cookie simples do site (vale em todas as páginas, sem expor nada pessoal). */
export function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}
