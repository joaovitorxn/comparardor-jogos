import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { HYPE_WINDOW_DAYS } from "@/lib/hype";

export const metadata: Metadata = {
  title: "O que é Hypar",
  description: "O Hypar é o foguete dos jogos: um voto seu para dizer que a promoção está valendo muito.",
  alternates: { canonical: "/hypar" },
};

export default function HyparPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 lg:px-6">
      <h1 className="flex items-center gap-3 font-display text-3xl font-bold uppercase tracking-tight">
        <Icon name="rocket" className="size-7 text-accent" />O que é Hypar
      </h1>
      <div className="mt-6 space-y-4 leading-relaxed text-text-2">
        <p>O foguete nos jogos é o jeito de você dizer: &ldquo;esta promoção está valendo muito&rdquo;. É um voto, não uma nota.</p>
        <p>
          Quanto mais gente hypa um jogo, mais acima ele aparece na ordem por relevância das promoções e mais claro fica para os outros visitantes que a
          comunidade aprovou. O efeito é leve de propósito: um ou dois hypes não mudam nada, é preciso bastante gente para um jogo subir de posição.
        </p>
        <p>
          Cada navegador hypa um jogo uma vez. Só contam os hypes dos últimos {HYPE_WINDOW_DAYS} dias, então a empolgação com uma promoção antiga não vale
          para a de agora. Sem conta e sem cadastro: guardamos um cookie com os jogos que você hypou e um código aleatório que não identifica você.
        </p>
        <p>
          Mais detalhes na <Link href="/privacidade" className="text-accent underline-offset-2 hover:underline">política de privacidade</Link>.
        </p>
      </div>
    </div>
  );
}
