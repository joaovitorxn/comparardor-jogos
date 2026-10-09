import type { IconName } from "@/components/icon";

export interface Novidade {
  /** Identificador estável: o último visto fica guardado no aparelho para acender (ou apagar) o pontinho do botão. */
  id: string;
  /** AAAA-MM-DD */
  date: string;
  title: string;
  text: string;
  icon: IconName;
  link?: { label: string; href: string };
}

/**
 * Novidades do site para quem usa, da mais nova para a mais antiga. Só entra o que a pessoa vê e usa
 * (nada de correções ou ajustes internos). Para anunciar algo, acrescente no topo; mantenha umas 5 e apague as mais velhas.
 */
export const NOVIDADES: Novidade[] = [
  {
    id: "hypar",
    date: "2026-10-09",
    title: "Hypar",
    text: "Achou uma promoção que está valendo muito? Passe o mouse no card do jogo (no celular, abra a página dele) e clique no foguete. Quanto mais gente hypa, mais o jogo sobe na lista de ofertas. Mudou de ideia? É só clicar de novo.",
    icon: "rocket",
    link: { label: "Ver as ofertas", href: "/ofertas" },
  },
  {
    id: "tema-oled",
    date: "2026-10-09",
    title: "Tema OLED",
    text: "Um tema de fundo preto puro, que fica ótimo em telas OLED e ajuda a poupar bateria. Escolha entre Escuro e OLED no rodapé do site.",
    icon: "monitor",
  },
  {
    id: "vale-esperar",
    date: "2026-10-07",
    title: "Vale esperar?",
    text: "Na página de cada jogo, o Dropou olha o histórico dos últimos 12 meses e diz se é um bom momento para comprar ou se costuma ficar mais barato. Muda conforme as plataformas que você marcou.",
    icon: "hourglass",
    link: { label: "Escolher um jogo nas ofertas", href: "/ofertas" },
  },
  {
    id: "wishlist",
    date: "2026-10-07",
    title: "Wishlist renovada",
    text: "Filtros por jogos em promoção e com alerta, preço e loja mais barata de cada jogo, e botões mais claros para criar ou remover alertas.",
    icon: "heart",
    link: { label: "Abrir minha wishlist", href: "/minha-lista" },
  },
  {
    id: "steam-deck",
    date: "2026-10-07",
    title: "Aprovado no Steam Deck",
    text: "Os jogos de PC mostram o selo da Valve quando são verificados ou jogáveis no Steam Deck.",
    icon: "handheld",
  },
];
