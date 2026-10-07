/** Esqueletos de carregamento: aparecem na hora ao trocar de página e dão lugar ao conteúdo real quando ele chega. */

const block = "skeleton rounded-[4px]";

function Bar({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`${block} ${className}`} />;
}

function Busy({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando">
      {children}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="aspect-[2/3] skeleton" />
      <div className="space-y-2 p-3">
        <Bar className="h-4 w-4/5" />
        <Bar className="h-5 w-2/5" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4 xl:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

function SectionTitleSkeleton() {
  return (
    <div className="mb-4 flex items-end justify-between border-b border-line pb-2.5">
      <Bar className="h-6 w-48" />
      <Bar className="hidden h-4 w-40 sm:block" />
    </div>
  );
}

/** Ofertas, busca e catálogo: título, barra de filtros e grade de capas. */
export function ListPageSkeleton({ toolbar = true }: { toolbar?: boolean }) {
  return (
    <Busy>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <SectionTitleSkeleton />
        {toolbar && (
          <div className="mb-5 flex flex-wrap gap-2">
            {["w-24", "w-28", "w-20", "w-24", "w-28", "w-20"].map((w, i) => (
              <Bar key={i} className={`h-9 ${w}`} />
            ))}
          </div>
        )}
        <CardGridSkeleton count={18} />
      </div>
    </Busy>
  );
}

/** Página inicial: banner em destaque e uma fileira de capas. */
export function HomeSkeleton() {
  return (
    <Busy>
      <div className="mx-auto max-w-7xl space-y-14 px-4 py-8 lg:px-6">
        <div aria-hidden className="h-72 skeleton rounded-card sm:h-96" />
        <section>
          <SectionTitleSkeleton />
          <CardGridSkeleton count={12} />
        </section>
      </div>
    </Busy>
  );
}

/** Wishlist: filtros e uma linha por jogo (capa, preço e botões). */
export function WishlistSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Busy>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {["w-24", "w-36", "w-32"].map((w, i) => (
            <Bar key={i} className={`h-9 ${w}`} />
          ))}
        </div>
        <ul aria-hidden className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {Array.from({ length: Math.max(count, 2) }, (_, i) => (
            <li key={i} className="flex items-center gap-4 p-3 sm:p-4">
              <div className="aspect-[2/3] w-16 shrink-0 skeleton rounded-[3px]" />
              <div className="flex-1 space-y-2.5">
                <Bar className="h-4 w-2/5" />
                <Bar className="h-5 w-1/3" />
                <Bar className="h-3 w-3/5" />
              </div>
              <Bar className="hidden h-8 w-28 sm:block" />
            </li>
          ))}
        </ul>
      </div>
    </Busy>
  );
}

/** Página do jogo: imagem, painel de melhor oferta e a tabela de lojas. */
export function GamePageSkeleton() {
  return (
    <Busy>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <Bar className="h-9 w-3/5" />
            <div aria-hidden className="aspect-video skeleton rounded-card" />
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Bar key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
          <div aria-hidden className="h-96 skeleton rounded-card" />
        </div>
      </div>
    </Busy>
  );
}
