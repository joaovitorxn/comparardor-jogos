import type { Metadata } from "next";
import { AmazonIcon, MercadoLivreIcon } from "@/components/brand-icons";
import { Icon, type IconName } from "@/components/icon";
import { SectionHeader } from "@/components/ui";
import images from "@/lib/setup-images.json";
import { SETUP_CATEGORIES, type SetupProduct } from "@/lib/setup-products";

export const metadata: Metadata = {
  title: "Setup",
  description: "Controles, mouses, teclados, monitores e áudio que eu recomendo pra jogar melhor.",
  alternates: { canonical: "/setup" },
};

const storeButton =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[4px] border border-line-strong bg-surface-2 px-2 py-1.5 text-xs font-medium text-text transition hover:border-accent hover:text-accent";

/** Botão de uma loja, com a logo dela em uma cor só (a do texto). */
function StoreButton({ store, href }: { store: "mercadolivre" | "amazon"; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer sponsored" className={storeButton}>
      {store === "amazon" ? <AmazonIcon className="size-4 shrink-0" /> : <MercadoLivreIcon className="size-[18px] shrink-0" />}
      {store === "amazon" ? "Amazon" : "Mercado Livre"}
      <span aria-hidden>↗</span>
    </a>
  );
}

/** A foto vem do anúncio do Mercado Livre (scripts/setup-photos.mts); a versão "F" é a grande, a "O" a pequena. */
function ProductPhoto({ product, fallback }: { product: SetupProduct; fallback: IconName }) {
  const image = product.mercadoLivre ? (images as Record<string, { image: string }>)[product.mercadoLivre]?.image : undefined;
  if (!image) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-surface-2 text-muted">
        <Icon name={fallback} className="size-14" />
      </div>
    );
  }
  const large = image.replace(/-O\.webp$/, "-F.webp");
  return (
    // fundo branco: as fotos dos anúncios são sobre branco
    <div className="flex aspect-[4/3] items-center justify-center bg-white p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        srcSet={`${image} 500w, ${large} 1200w`}
        sizes="(min-width: 1280px) 290px, (min-width: 640px) 33vw, 90vw"
        alt={product.name}
        loading="lazy"
        decoding="async"
        className="size-full object-contain"
      />
    </div>
  );
}

function ProductCard({ product, fallback }: { product: SetupProduct; fallback: IconName }) {
  return (
    <li className="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
      <ProductPhoto product={product} fallback={fallback} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-medium leading-snug">{product.name}</h3>
        <p className="flex-1 text-sm leading-relaxed text-text-2">{product.why}</p>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {product.mercadoLivre && <StoreButton store="mercadolivre" href={product.mercadoLivre} />}
          {product.amazon && <StoreButton store="amazon" href={product.amazon} />}
        </div>
      </div>
    </li>
  );
}

export default function SetupPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 lg:px-6">
      <header>
        <SectionHeader title="Setup" icon="mouse" aside="Equipamentos que eu recomendo" />
        <p className="max-w-2xl leading-relaxed text-text-2">
          Recomendações de itens que eu uso (ou usaria) pra jogar melhor. Sem exagero e sem lista infinita: só o que realmente vale a pena. Comprando por aqui, você apoia o Dropou sem gastar
          um centavo a mais.
        </p>
      </header>

      {SETUP_CATEGORIES.map((c) => (
        <section key={c.id} id={c.id}>
          <SectionHeader title={c.title} icon={c.icon} />
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {c.items.map((p) => (
              <ProductCard key={p.name} product={p} fallback={c.icon} />
            ))}
          </ul>
        </section>
      ))}

      <p className="text-xs text-muted">Links de afiliado do Mercado Livre e da Amazon: se você comprar depois de clicar, o Dropou pode receber uma comissão, sem custo extra pra você.</p>
    </div>
  );
}
