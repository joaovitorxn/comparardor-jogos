export interface FaqItem {
  question: string;
  answer: string;
}

/** Perguntas mais comuns sobre o funcionamento do Dropou, no fim da home. Respostas em texto simples (vão também para o Google). */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "De onde vêm os preços e de quanto em quanto tempo eles são atualizados?",
    answer:
      "Os preços vêm das próprias lojas, as mesmas listadas acima em Lojas monitoradas. Parte do histórico de preços vem da IsThereAnyDeal. Um robô confere as ofertas de hora em hora, dando prioridade às que estão em promoção.",
  },
  {
    question: "O Dropou vende os jogos? Posso confiar nos preços?",
    answer:
      "Não vendo nada: o botão de compra leva você para a loja, e a compra acontece lá. Os preços são coletados automaticamente e podem mudar entre uma atualização e outra, então confira o valor final na loja antes de pagar.",
  },
  {
    question: "Como o Dropou se mantém? Isso muda a ordem das ofertas?",
    answer:
      "É um projeto em beta, mantido por uma pessoa. Ele conta com o apoio de quem quiser contribuir e com links de afiliado: se você comprar depois de clicar, posso receber uma comissão, sem custo extra para você. As ofertas são sempre ordenadas pelo menor preço; uma loja parceira só aparece primeiro quando o preço é exatamente igual ao de outra.",
  },
  {
    question: "Preciso criar conta? Como funcionam a wishlist e os alertas de preço?",
    answer:
      "Não há conta nem cadastro. A wishlist fica salva no seu aparelho e não sincroniza entre aparelhos. O alerta de preço usa a notificação do navegador: você escolhe o valor no botão do jogo e eu aviso quando ele baixar disso ou entrar em promoção. No iPhone, é preciso antes adicionar o site à tela de início.",
  },
  {
    question: "O que é o veredito \"Vale esperar\"?",
    answer:
      "É o veredito que aparece na página do jogo. Ele compara o preço de hoje com o histórico e com o calendário das grandes promoções das lojas, e indica se vale comprar agora ou esperar. É uma estimativa: promoções futuras não são garantidas.",
  },
  {
    question: "O que é Hypar?",
    answer:
      "É o foguete que aparece ao passar o mouse no card de um jogo (no celular, fica na página do jogo). É um voto seu dizendo que aquela promoção está valendo muito. Quanto mais gente hypa, mais o jogo sobe na ordem por relevância das ofertas, mas o efeito é leve de propósito: um ou dois hypes não mudam nada. Vale um voto por jogo em cada navegador, e só contam os hypes dos últimos 30 dias. Sem conta: guardo um cookie com os jogos que você hypou.",
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
