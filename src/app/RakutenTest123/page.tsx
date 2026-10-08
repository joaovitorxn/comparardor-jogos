import type { Metadata } from "next";

// página de verificação de propriedade pedida pela Rakuten Advertising (conta de afiliado): fora dos buscadores e do mapa do site
export const metadata: Metadata = { title: "RakutenTest123", robots: { index: false, follow: false } };

export default function RakutenTestPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">RakutenTest123</h1>
      <p className="mt-4 text-text-2">Página de verificação do site dropou.com.br para a Rakuten Advertising.</p>
    </div>
  );
}
