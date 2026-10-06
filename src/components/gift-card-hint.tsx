import { Icon } from "./icon";
import { PlatformIcon } from "./store-logo";

const CARDS: Record<string, string> = { playstation: "Gift Card PlayStation", xbox: "Gift Card Xbox", nintendo: "Gift Card Nintendo" };
// links de afiliado (Mercado Livre) de cada Gift Card
const LINKS: Record<string, string> = { playstation: "https://meli.la/1VRkWfo", xbox: "https://meli.la/26HegzB", nintendo: "https://meli.la/14VmE7s" };
// cor de cada console (versões claras o bastante para ler no fundo escuro do site)
const BRAND_COLORS: Record<string, string> = { playstation: "#3b8cff", xbox: "#3fb950", nintendo: "#ff4d4d" };

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
        <Icon name="ticket" className="size-5 text-accent" />
        Vai comprar na loja do console?
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 text-sm">
        <p className="min-w-0 flex-1 basis-56 font-medium text-text">Use Gift Cards e tenha mais flexibilidade</p>
        <div className="flex flex-wrap gap-2">
          {cards.map((f) => (
            <a
              key={f}
              data-family={f}
              href={LINKS[f]}
              target="_blank"
              rel="noopener noreferrer sponsored"
              style={{ color: BRAND_COLORS[f], "--brand": BRAND_COLORS[f] } as React.CSSProperties}
              className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-line-strong bg-surface-2 px-3 py-1.5 text-xs font-semibold transition hover:border-[color:var(--brand)] hover:brightness-110"
            >
              <PlatformIcon family={f} className="size-4" />
              {CARDS[f]} <span aria-hidden>↗</span>
            </a>
          ))}
        </div>
      </div>
      <p className="border-t border-line px-4 py-2 text-[11px] text-muted">Comprando aqui você apoia o Dropou.</p>
    </div>
  );
}
