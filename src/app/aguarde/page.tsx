import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/search-form";

export const metadata: Metadata = { title: "Tente novamente em instantes", robots: { index: false } };

export default async function WaitPage(props: PageProps<"/aguarde">) {
  const { erro } = await props.searchParams;
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-accent">Um momento</p>
      <h1 className="mb-3 mt-2 font-display text-4xl font-bold uppercase">
        {erro ? "A loja não respondeu" : "Muitas buscas seguidas"}
      </h1>
      <p className="mb-8 text-text-2">
        {erro
          ? "Não conseguimos consultar a Steam agora. Tente de novo em alguns segundos."
          : "Para não sobrecarregar as lojas, limitamos quantos jogos novos podem ser consultados por vez. Tente de novo em alguns minutos — os jogos que já estão no catálogo continuam disponíveis."}
      </p>
      <SearchForm size="lg" />
      <Link href="/" className="mt-6 inline-block text-sm text-text-2 underline-offset-4 hover:text-accent hover:underline">
        Voltar para o início
      </Link>
    </div>
  );
}
