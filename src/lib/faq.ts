export interface FaqItem {
  question: string;
  answer: string;
}

/** Perguntas mais comuns sobre o funcionamento do Dropou, no fim da home. Respostas em texto simples (vão também para o Google). */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "De onde vêm os preços e com que frequência eles são atualizados?",
    answer:
      "Os preços vêm das próprias lojas, as mesmas que aparecem acima em Lojas monitoradas. O Dropou confere tudo de hora em hora, olhando primeiro os jogos que estão em promoção.",
  },
  {
    question: "O Dropou vende os jogos? Posso confiar nos preços?",
    answer:
      "Não vendo nada. O botão de compra leva você para a loja, e é lá que você paga. Como os preços mudam o tempo todo, confira o valor final na loja antes de comprar.",
  },
  {
    question: "Como o Dropou se mantém? Isso muda a ordem das ofertas?",
    answer:
      "O Dropou é um projeto novo, feito por uma pessoa só. Ele se mantém com o apoio de quem quer ajudar e com links de parceria: se você comprar depois de clicar, posso ganhar um pequeno valor da loja, e você não paga nada a mais por isso. A ordem das ofertas é sempre do mais barato para o mais caro. A loja parceira só aparece na frente quando o preço é exatamente o mesmo.",
  },
  {
    question: "Preciso criar conta? Como funcionam a wishlist e os alertas de preço?",
    answer:
      "Não precisa de conta nem de cadastro. A wishlist fica guardada no seu aparelho, então ela não aparece em outro celular ou computador. No alerta de preço, você escolhe quanto quer pagar e o Dropou avisa você quando o jogo chegar nesse valor ou entrar em promoção. No iPhone, é preciso antes adicionar o site à tela inicial.",
  },
  {
    question: "O que é o \"Vale esperar\"?",
    answer:
      "É a dica que aparece na página do jogo dizendo se vale comprar agora ou esperar uma promoção melhor. Ela compara o preço de hoje com os preços de antes e com as épocas em que as lojas costumam fazer liquidação. É só uma dica: ninguém garante que o preço vá cair.",
  },
  {
    question: "O que é Hypar?",
    answer:
      "É o foguete que aparece quando você passa o mouse sobre um jogo (no celular, ele fica dentro da página do jogo). Ao clicar, você diz que aquela promoção está valendo muito a pena. Quanto mais gente faz isso, mais o jogo sobe na lista de ofertas, mas só um pouquinho: é preciso muita gente para mudar a posição. Cada pessoa pode hypar um jogo uma vez, e só valem os votos dos últimos 30 dias.",
  },
];

/** Dados estruturados (schema.org/FAQPage) das mesmas perguntas, para o Google. */
export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
