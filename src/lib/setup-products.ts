import type { IconName } from "@/components/icon";

export interface SetupProduct {
  name: string;
  /** Por que está na lista (a opinião de quem mantém o site). */
  why: string;
  /** Links de afiliado; o botão de cada loja só aparece se o link existir. A foto vem do anúncio do Mercado Livre. */
  mercadoLivre?: string;
  amazon?: string;
}

export interface SetupCategory {
  id: string;
  title: string;
  icon: IconName;
  items: SetupProduct[];
}

export const SETUP_CATEGORIES: SetupCategory[] = [
  {
    id: "controles",
    title: "Controles",
    icon: "controller",
    items: [
      {
        name: "Controle Gamesir Cyclone 2",
        why: "Controle com dock, joysticks Hall-Effect, botões mecânicos e software pra customizar TUDO.",
        mercadoLivre: "https://meli.la/1Mw1ti7",
        amazon: "https://link.amazon/B00obotlG",
      },
      {
        name: "Controle Gamesir G7 Pro",
        why: "Um dos melhores controles do mercado, o pacote completo. Compatível com PC e Xbox.",
        mercadoLivre: "https://meli.la/14K4Wcb",
        amazon: "https://link.amazon/B00CPv1OK",
      },
    ],
  },
  {
    id: "mouses",
    title: "Mouses",
    icon: "mouse",
    items: [
      {
        name: "Mouse ATTACK SHARK R2",
        why: "Feito de liga de magnésio, ultra leve e tem um dos melhores sensores do mercado.",
        mercadoLivre: "https://meli.la/2kUWHUZ",
      },
    ],
  },
  {
    id: "teclados",
    title: "Teclados",
    icon: "keyboard",
    items: [
      {
        name: "Teclado ATTACK SHARK X68HE",
        why: "Switch magnético, desempenho topo de linha e preço acessível.",
        mercadoLivre: "https://meli.la/1ztmH1E",
        amazon: "https://link.amazon/B01oFhW9u",
      },
      {
        name: "Teclado Akko TAC75 HE",
        why: "Teclado 75% com switch magnético, um dos mais populares do momento, e com razão!",
        mercadoLivre: "https://meli.la/292YFHB",
        amazon: "https://link.amazon/B0fJkjCDc",
      },
    ],
  },
  {
    id: "monitores",
    title: "Monitores",
    icon: "monitor",
    items: [
      {
        name: "Monitor LG OLED UltraGear 27GX704A-B",
        why: "2K, 240Hz e OLED. Depois de usar esse, sua vida nunca mais é a mesma!",
        mercadoLivre: "https://meli.la/22Duj4D",
        amazon: "https://link.amazon/B04n2qZfc",
      },
      {
        name: 'Monitor portátil ARZOPA Z1FC 16.1"',
        why: "1080p, 144Hz e IPS. A tela perfeita pra você levar pra qualquer lugar, vídeo e energia com apenas um cabo USB-C Thunderbolt!",
        mercadoLivre: "https://meli.la/28Z8ifd",
        amazon: "https://link.amazon/B02LG3rLC",
      },
    ],
  },
  {
    id: "audio",
    title: "Áudio",
    icon: "headphones",
    items: [
      {
        name: "Microfone Fifine AM8",
        why: "Bom e barato, é a prova de que não precisa gastar muito pra ter qualidade.",
        mercadoLivre: "https://meli.la/2dcA22L",
        amazon: "https://link.amazon/B04MasU5u",
      },
      {
        name: "Fone HIFIMAN HE400SE",
        why: "Fone planar magnético e open-back, o melhor custo benefício dessa categoria.",
        mercadoLivre: "https://meli.la/2KiMhTU",
        amazon: "https://link.amazon/B040Jg3EG",
      },
      {
        name: "Fone IEM Moondrop Chu III",
        why: "IEM acessível e com qualidade excelente, perfeito pra começar no mundo dos IEMs.",
        mercadoLivre: "https://meli.la/234mJSY",
        amazon: "https://link.amazon/B0eN7YEgT",
      },
    ],
  },
];
