import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import Link from "next/link";
import { BetaNotice } from "@/components/beta-notice";
import { ClickTracker } from "@/components/click-tracker";
import { FeedbackButton } from "@/components/feedback-button";
import { KofiButton } from "@/components/kofi-button";
import { LiveVisitors } from "@/components/live-visitors";
import { LogoMark, SiteHeader } from "@/components/site-header";
import { BRAND } from "@/lib/brand";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// títulos, preços em destaque e rótulos — condensada dá o tom "gamer" sem virar fantasia
const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  // na Vercel, o domínio de produção (dropou.com.br) — base das URLs da imagem de compartilhamento
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s — ${BRAND.name}`,
  },
  description: BRAND.description,
  // instalado na tela inicial do iPhone, abre como app (requisito para notificações no iOS)
  appleWebApp: {
    capable: true,
    title: BRAND.name,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d12",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {/* só aparece quando recebe o foco do teclado: pula o cabeçalho e vai direto ao conteúdo */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-[4px] focus:bg-accent focus:px-3 focus:py-2 focus:font-display focus:text-sm focus:font-bold focus:uppercase focus:tracking-wide focus:text-accent-ink"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <div className="mx-auto flex h-10 w-full max-w-7xl items-center justify-end px-4 lg:px-6">
          <LiveVisitors />
        </div>
        <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <footer className="mt-16 border-t border-line bg-surface">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-muted sm:flex-row sm:items-start sm:justify-between lg:px-6">
            <Link href="/" className="flex items-center gap-2 text-text-2">
              <LogoMark className="size-5" />
              <span className="font-display text-base font-bold uppercase tracking-wide">
                {BRAND.name}
              </span>
            </Link>
            <p className="max-w-xl leading-relaxed sm:text-right">
              Preços coletados das lojas e podem mudar sem aviso. Confira sempre
              na loja antes de comprar. Parte dos preços e do histórico vem da{" "}
              <a
                href="https://isthereanydeal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-text"
              >
                IsThereAnyDeal
              </a>
              . Marcas e logos pertencem às respectivas lojas.
            </p>
          </div>
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 border-t border-line px-4 py-4 text-xs text-muted sm:flex-row lg:px-6">
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              <span>© 2026 {BRAND.name}</span>
              <Link href="/privacidade" className="hover:text-accent">
                Privacidade
              </Link>
              <Link href="/termos" className="hover:text-accent">
                Termos de uso
              </Link>
              {BRAND.contactEmail && (
                <a href={`mailto:${BRAND.contactEmail}`} className="flex items-center gap-1.5 hover:text-accent">
                  <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                  {BRAND.contactEmail}
                </a>
              )}
              <a
                href={BRAND.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-accent"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                </svg>
                {BRAND.instagram.handle}
              </a>
            </p>
            <p className="flex items-center gap-1.5">
              Desenvolvido por Berk
              <svg
                viewBox="0 0 24 24"
                role="img"
                aria-label="com carinho"
                className="size-3.5 text-danger"
                fill="currentColor"
              >
                <path d="M12 21s-7.5-4.6-9.6-9.3A5.6 5.6 0 0 1 12 5.9a5.6 5.6 0 0 1 9.6 5.8C19.5 16.4 12 21 12 21Z" />
              </svg>
            </p>
          </div>
        </footer>
        <FeedbackButton />
        <KofiButton />
        <ClickTracker />
        <BetaNotice />
        <Analytics />
      </body>
    </html>
  );
}
