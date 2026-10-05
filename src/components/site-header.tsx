import Link from "next/link";
import { BRAND, LOGO } from "@/lib/brand";
import { Icon } from "./icon";
import { MobileSearch } from "./mobile-search";
import { SearchForm } from "./search-form";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox={LOGO.viewBox} aria-hidden className={className}>
      <rect width="28" height="28" rx="5" fill="var(--accent)" />
      <path d={LOGO.arrow} fill="none" stroke="var(--accent-ink)" strokeWidth={LOGO.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d={LOGO.loot} fill="var(--accent-ink)" />
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
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${BRAND.name} — início`}>
          <LogoMark />
          <span className="font-display text-2xl font-bold uppercase leading-none tracking-wide">{BRAND.name}</span>
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="font-display text-sm font-semibold uppercase tracking-wider text-text-2 transition hover:text-text">
              {item.label}
            </Link>
          ))}
        </nav>
        <SearchForm className="ml-auto hidden w-full max-w-sm sm:block" />
        <MobileSearch />
        <Link href="/ofertas" aria-label="Ofertas" className="flex shrink-0 text-text-2 transition hover:text-accent md:hidden">
          <Icon name="tag" className="size-5" />
        </Link>
        <Link
          href="/minha-lista"
          aria-label="Wishlist"
          className="flex shrink-0 items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-text-2 transition hover:text-accent"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
            <path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6c-2.3 4.6-9.3 9-9.3 9Z" />
          </svg>
          <span className="hidden lg:inline">Wishlist</span>
        </Link>
      </div>
    </header>
  );
}
