import type { OfferRow } from "@/db/queries";
import { formatCents } from "@/lib/format";
import { DRM_LABELS, offerFamilies, PLATFORM_LABELS } from "@/lib/stores";
import { CopyCoupon } from "./copy-coupon";
import { StoreName } from "./store-logo";
import { buttonStyles, DiscountBadge, PriceText, Tag } from "./ui";

const COLS = "md:grid-cols-[minmax(0,1.7fr)_56px_minmax(0,1.1fr)_minmax(0,1.3fr)_112px_116px]";

export function PriceTable({ offers }: { offers: OfferRow[] }) {
  const best = offers[0]?.finalCents;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className={`hidden gap-4 border-b border-line bg-surface-2 px-4 py-2 font-display text-xs font-semibold uppercase tracking-wider text-muted md:grid ${COLS}`}>
        <span>Loja</span>
        <span>Plat.</span>
        <span>Preço</span>
        <span>Cupom</span>
        <span className="text-right">Final</span>
        <span />
      </div>

      {offers.map(({ listing, snapshot, coupon, finalCents }) => {
        const isBest = finalCents != null && finalCents === best;
        return (
          <div
            key={listing.id}
            data-family={offerFamilies(listing).join(" ")}
            className={`relative grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3.5 text-sm last:border-b-0 ${COLS} ${
              isBest ? "bg-accent-soft" : "transition hover:bg-surface-2"
            }`}
          >
            {isBest && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-accent" />}

            <div className="flex min-w-0 flex-col gap-1.5">
              <StoreName store={listing.store} />
              <div className="flex flex-wrap gap-1 pl-[38px]">
                {isBest && <Tag tone="accent">Menor preço</Tag>}
                {/* no celular a coluna de plataforma some; a etiqueta ocupa o lugar dela */}
                <span className="md:hidden">
                  <Tag>{PLATFORM_LABELS[listing.platform]}</Tag>
                </span>
                {listing.drm && <Tag>{DRM_LABELS[listing.drm] ?? listing.drm}</Tag>}
                {listing.isKey && <Tag>Chave</Tag>}
                {listing.edition !== "Padrão" && <Tag>{listing.edition}</Tag>}
              </div>
            </div>

            <span className="hidden text-text-2 md:block">{PLATFORM_LABELS[listing.platform]}</span>

            <div className="hidden md:block">
              {snapshot ? (
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {snapshot.discountPercent > 0 && <DiscountBadge percent={snapshot.discountPercent} size="sm" />}
                  <PriceText cents={snapshot.priceCents} className="text-text-2" />
                  {snapshot.discountPercent > 0 && (
                    <span className="tabular text-xs text-muted line-through">{formatCents(snapshot.regularPriceCents)}</span>
                  )}
                </span>
              ) : (
                <span className="text-muted">Indisponível</span>
              )}
            </div>

            <div className="col-span-2 row-start-2 min-w-0 text-xs md:col-span-1 md:row-start-auto">
              {listing.voucher ? (
                <span className="flex flex-wrap items-center gap-1.5">
                  <CopyCoupon code={listing.voucher} />
                  <span className="text-muted">já incluído no preço</span>
                </span>
              ) : coupon?.coupon ? (
                <span className="flex flex-wrap items-center gap-1.5">
                  {coupon.coupon.code ? <CopyCoupon code={coupon.coupon.code} /> : <Tag tone="coupon">Automático</Tag>}
                  <span className="tabular font-medium text-coupon">−{formatCents(coupon.savedCents)}</span>
                  <span className="w-full truncate text-muted" title={coupon.coupon.description}>
                    {coupon.coupon.description}
                  </span>
                </span>
              ) : (
                <span className="hidden text-muted md:inline">—</span>
              )}
            </div>

            <div className="text-right">
              {snapshot && snapshot.discountPercent > 0 && (
                <span className="mr-2 md:hidden">
                  <DiscountBadge percent={snapshot.discountPercent} size="sm" />
                </span>
              )}
              <span className={`font-display text-xl font-bold ${isBest ? "text-accent" : "text-text"}`}>
                {finalCents != null ? <PriceText cents={finalCents} /> : "—"}
              </span>
            </div>

            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={`col-span-2 md:col-span-1 ${isBest ? buttonStyles.primarySm : buttonStyles.secondary}`}
            >
              {isBest ? "Comprar" : "Ver na loja"} <span aria-hidden>↗</span>
            </a>
          </div>
        );
      })}
    </div>
  );
}
