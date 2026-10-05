import Link from "next/link";
import { SearchForm } from "./search-form";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" aria-hidden className={className}>
      <rect width="28" height="28" rx="5" fill="var(--accent)" />
      {/* linha de preço caindo */}
      <path d="M6 9l6 6 3.5-3.5L22 18" fill="none" stroke="var(--accent-ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 12.5V18h-5.5" fill="none" stroke="var(--accent-ink)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV = [
  { href: "/ofertas", label: "Ofertas" },
  { href: "/busca", label: "Explorar" },
  { href: "/#lojas", label: "Lojas" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="comparador.jogos — início">
          <LogoMark />
          <span className="hidden font-display text-xl font-bold uppercase tracking-wide sm:inline">
            comparador<span className="text-accent">.jogos</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="font-display text-sm font-semibold uppercase tracking-wider text-text-2 transition hover:text-text">
              {item.label}
            </Link>
          ))}
        </nav>
        <SearchForm className="ml-auto w-full max-w-sm" />
        <Link
          href="/minha-lista"
          aria-label="Minha lista"
          className="flex shrink-0 items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-text-2 transition hover:text-accent"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
            <path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6c-2.3 4.6-9.3 9-9.3 9Z" />
          </svg>
          <span className="hidden lg:inline">Minha lista</span>
        </Link>
      </div>
    </header>
  );
}
