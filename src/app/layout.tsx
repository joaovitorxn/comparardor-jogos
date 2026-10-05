import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import Link from "next/link";
import { LogoMark, SiteHeader } from "@/components/site-header";
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
  title: {
    default: "comparador.jogos — o menor preço de cada jogo",
    template: "%s — comparador.jogos",
  },
  description: "Compare preços de jogos na Steam, GOG, Epic, Nuuvem, Green Man Gaming e Microsoft Store, já com cupons.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${barlow.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="mt-16 border-t border-line bg-surface">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-muted sm:flex-row sm:items-start sm:justify-between lg:px-6">
            <Link href="/" className="flex items-center gap-2 text-text-2">
              <LogoMark className="size-5" />
              <span className="font-display text-sm font-bold uppercase tracking-wide">comparador.jogos</span>
            </Link>
            <p className="max-w-xl leading-relaxed sm:text-right">
              Preços coletados das lojas e podem mudar sem aviso. Confira sempre na loja antes de comprar. Parte dos preços e
              do histórico vem da{" "}
              <a href="https://isthereanydeal.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-text">
                IsThereAnyDeal
              </a>
              . Marcas e logos pertencem às respectivas lojas.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
