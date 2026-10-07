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
        why: "Sticks TMR, gatilhos Hall-Effect e botões mecânicos. A versão Bundle ainda vem com dock de carga. Funciona no PC, Switch e celular.",
        mercadoLivre: "https://meli.la/1Mw1ti7",
        amazon: "https://link.amazon/B00obotlG",
      },
      {
        name: "Controle Gamesir G7 Pro",
        why: "Licenciado Xbox e PC, com sticks TMR, gatilhos Hall-Effect, botões extras e dock de carga incluso. Pacote completo pelo preço.",
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
        why: "Liga de magnésio, menos de 50 g e sensor PixArt PAW3950, um dos melhores do mercado. 8000Hz de polling.",
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
        why: "Switch magnético com Rapid Trigger, 8000Hz e acionamento ajustável. Recursos de teclado caro com preço acessível. Layout americano (sem Ç).",
        mercadoLivre: "https://meli.la/1ztmH1E",
        amazon: "https://link.amazon/B01oFhW9u",
      },
      {
        name: "Teclado Akko TAC75 HE",
        why: "75% com switch magnético, Rapid Trigger de 0,005 mm e 8000Hz. Aceita trocar por outros switches magnéticos. Layout americano (sem Ç).",
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
        why: "OLED 27\" em 2K, 240Hz e 0,03 ms de resposta. Depois de usar, é difícil voltar pra um IPS!",
        mercadoLivre: "https://meli.la/22Duj4D",
        amazon: "https://link.amazon/B04n2qZfc",
      },
      {
        name: 'Monitor portátil ARZOPA Z1FC 16.1"',
        why: "1080p, 144Hz e IPS, fino e leve (9 mm). Imagem e energia com um único cabo USB-C. Funciona no PC, console e Steam Deck.",
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
        why: "Microfone dinâmico com USB-C e XLR, monitoramento de áudio e RGB. Voz limpa por um preço baixo (cabo XLR vendido à parte).",
        mercadoLivre: "https://meli.la/2dcA22L",
        amazon: "https://link.amazon/B04MasU5u",
      },
      {
        name: "Fone HIFIMAN HE400SE",
        why: "Planar magnético aberto com palco sonoro amplo e fácil de usar. Um dos planares mais baratos. Como é aberto, não serve pra ambiente barulhento.",
        mercadoLivre: "https://meli.la/2KiMhTU",
        amazon: "https://link.amazon/B040Jg3EG",
      },
      {
        name: "Fone IEM Moondrop Chu III",
        why: "IEM de metal com cabo destacável e som agradável, ótimo pra começar. Não tem microfone.",
        mercadoLivre: "https://meli.la/234mJSY",
        amazon: "https://link.amazon/B0eN7YEgT",
      },
    ],
  },
];
