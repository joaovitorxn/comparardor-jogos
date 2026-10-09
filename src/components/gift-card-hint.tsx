import { Icon } from "./icon";
import { PlatformIcon } from "./store-logo";

const CARDS: Record<string, string> = { playstation: "Gift Card PlayStation", xbox: "Gift Card Xbox", nintendo: "Gift Card Nintendo" };
// links de afiliado (Mercado Livre) de cada Gift Card
const LINKS: Record<string, string> = { playstation: "https://meli.la/1VRkWfo", xbox: "https://meli.la/26HegzB", nintendo: "https://meli.la/14VmE7s" };
// cor de cada console (versões claras o bastante para ler no fundo escuro do site)
const BRAND_COLORS: Record<string, string> = { playstation: "#3b8cff", xbox: "#3fb950", nintendo: "#ff4d4d" };

/** Famílias de plataforma que têm Gift Card (o PC não tem). */
export const GIFT_CARD_FAMILIES = Object.keys(CARDS);

/** Botão de um Gift Card: logo e nome do console na cor dele, no estilo dos botões secundários do site. */
export function GiftCardButton({ family, shortOnMobile = false }: { family: string; shortOnMobile?: boolean }) {
  return (
    <a
      data-family={family}
      data-track="giftcard"
      data-store="mercadolivre"
      data-target={family}
      href={LINKS[family]}
      target="_blank"
      rel="noopener noreferrer sponsored"
      style={{ color: BRAND_COLORS[family], "--brand": BRAND_COLORS[family] } as React.CSSProperties}
      className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-line-strong bg-surface-2 px-3 py-1.5 text-xs font-semibold max-md:min-h-11 transition hover:border-[color:var(--brand)] hover:brightness-110"
    >
      <PlatformIcon family={family} className="size-4 shrink-0" />
      <span>
        {/* no celular da faixa da página inicial só o nome do console, para os três botões caberem numa linha */}
        <span className={shortOnMobile ? "max-sm:hidden" : undefined}>Gift Card </span>
        {CARDS[family].replace("Gift Card ", "")}
      </span>{" "}
      <span aria-hidden className="max-sm:hidden">↗</span>
    </a>
  );
}

/** Faixa de uma linha da página inicial: texto à esquerda e os botões à direita (só dos consoles escolhidos, ou todos). */
export function GiftCardStrip({ families }: { families: string[] }) {
  const cards = GIFT_CARD_FAMILIES.filter((f) => !families.length || families.includes(f));
  if (!cards.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-card border border-line bg-surface px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Icon name="gift" className="size-5 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="font-display text-base font-bold uppercase leading-tight tracking-wide text-text">Aproveite os drops com Gift Cards</p>
          <p className="text-xs text-muted">Comprando aqui você apoia o Dropou.</p>
        </div>
      </div>
      <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
        {cards.map((f) => (
          <GiftCardButton key={f} family={f} shortOnMobile />
        ))}
      </div>
    </div>
  );
}

/**
 * Sugestão de Gift Card (crédito pré-pago) para as lojas de console em que o jogo está à venda. Mesmo molde
 * da tabela de preços: cabeçalho em caixa alta, uma linha com o texto e os botões "secundários" do site.
 */
export function GiftCardHint({ families }: { families: string[] }) {
  const cards = families.filter((f) => CARDS[f]);
  if (!cards.length) return null;
  return (
    // data-family: o filtro de plataforma da tabela (PlatformFilter) esconde o que não é da plataforma escolhida
    <div data-family={cards.join(" ")} className="mt-3 overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5 font-display text-base font-bold uppercase tracking-wide text-text">
        <Icon name="gift" className="size-5 text-accent" />
        Vai comprar na loja do console?
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 text-sm">
        <p className="min-w-0 flex-1 basis-56 font-medium text-text">Use Gift Cards e tenha mais flexibilidade</p>
        <div className="flex flex-wrap gap-2">
          {cards.map((f) => (
            <GiftCardButton key={f} family={f} />
          ))}
        </div>
      </div>
      <p className="border-t border-line px-4 py-2 text-xs text-muted">Comprando aqui você apoia o Dropou.</p>
    </div>
  );
}
