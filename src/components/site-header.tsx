import Link from "next/link";
import { BRAND, LOGO } from "@/lib/brand";
import { Icon, type IconName } from "./icon";
import { MobileSearch } from "./mobile-search";
import { PlatformSelector } from "./platform-selector";
import { SearchForm } from "./search-form";
import { WhatsNew } from "./whats-new";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox={LOGO.viewBox} aria-hidden className={className}>
      <rect width="28" height="28" rx="5" fill="var(--accent)" />
      <path d={LOGO.arrow} fill="none" stroke="var(--accent-ink)" strokeWidth={LOGO.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d={LOGO.loot} fill="var(--accent-ink)" />
    </svg>
  );
}

const NAV: { href: string; label: string; icon: IconName; highlight?: boolean }[] = [
  { href: "/ofertas", label: "Ofertas", icon: "tag" },
  { href: "/busca", label: "Explorar", icon: "compass" },
  { href: "/setup", label: "Setup", icon: "mouse", highlight: true },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 min-[400px]:gap-3 sm:gap-6 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${BRAND.name} — início`}>
          <LogoMark />
          <span className="font-display text-2xl font-bold uppercase leading-none tracking-wide">{BRAND.name}</span>
          <span
            title="O Dropou está em beta: pode ter bugs. Conte pra mim pelo botão de feedback."
            className="-ml-0.5 -mt-3 rounded-[3px] border border-accent-line bg-accent-soft px-1 py-px font-display text-[10px] font-bold uppercase leading-none tracking-widest text-accent"
          >
            Beta
          </span>
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.highlight
                  ? "group flex items-center gap-1.5 rounded-[4px] border border-accent-line bg-accent-soft px-2.5 py-1 font-display text-sm font-semibold uppercase tracking-wider text-accent transition hover:bg-accent hover:text-accent-ink"
                  : "flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wider text-text-2 transition hover:text-text"
              }
            >
              <Icon name={item.icon} className="size-4" />
              {item.label}
              {item.highlight && <span className="rounded-[3px] border border-accent-line px-1 text-[10px] font-bold leading-4 tracking-wider text-accent group-hover:border-accent-ink/40 group-hover:text-accent-ink">NOVO</span>}
            </Link>
          ))}
        </nav>
        <SearchForm className="ml-auto hidden w-full max-w-sm sm:block" />
        <MobileSearch />
        <PlatformSelector />
        <WhatsNew />
        <Link
          href="/minha-lista"
          aria-label="Wishlist"
          className="relative after:absolute after:-inset-2 after:content-[''] flex shrink-0 items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-text-2 transition hover:text-accent"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
            <path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6c-2.3 4.6-9.3 9-9.3 9Z" />
          </svg>
          <span className="hidden lg:inline">Wishlist</span>
        </Link>
      </div>
      {/* no celular o menu vira uma segunda linha, também fixa no topo: dá para trocar de página sem voltar ao começo */}
      <nav aria-label="Menu" className="grid grid-cols-3 gap-1 border-t border-line px-3 py-1.5 md:hidden">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`group flex min-h-10 items-center justify-center gap-1.5 rounded-[4px] border py-1.5 font-display text-xs font-semibold uppercase tracking-wider transition ${
            item.highlight ? "border-accent-line bg-accent-soft text-accent" : "border-transparent text-text-2 hover:text-text"
          }`}
        >
          <Icon name={item.icon} className="size-4" />
          {item.label}
          {item.highlight && <span className="rounded-[3px] border border-accent-line px-1 text-[10px] font-bold leading-4 tracking-wider text-accent group-hover:border-accent-ink/40 group-hover:text-accent-ink">NOVO</span>}
        </Link>
      ))}
      </nav>
    </header>
  );
}
