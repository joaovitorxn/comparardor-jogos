import Link from "next/link";
import { GameOver } from "@/components/game-over";
import { SearchForm } from "@/components/search-form";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <GameOver className="mx-auto mb-6 w-56" />
      <h1 className="mb-3 font-display text-4xl font-bold uppercase">Jogo não encontrado</h1>
      <p className="mb-8 text-text-2">Ele pode ainda não estar no catálogo. Tente buscar pelo nome.</p>
      <SearchForm size="lg" />
      <Link href="/" className="mt-6 inline-block text-sm text-text-2 underline-offset-4 hover:text-accent hover:underline">
        Voltar para o início
      </Link>
    </div>
  );
}
