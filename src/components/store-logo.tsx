import { siEpicgames, siGogdotcom, siPlaystation, siSteam } from "simple-icons";
import { getStore } from "@/lib/stores";

/**
 * Logo oficial da Xbox. As versões recentes do simple-icons o removeram a pedido da Microsoft;
 * o traçado é o da versão 9.21.0 (CC0), usado só para identificar a loja.
 */
const XBOX_PATH =
  "M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.002 17.48 24 14.861 24 12.004c0-3.34-1.365-6.362-3.57-8.536 0 0-.027-.022-.082-.042-.063-.022-.152-.045-.281-.045-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042C1.365 5.642 0 8.664 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245-.131 0-.223.021-.281.046v-.002zM12 3.551S9.055 1.828 6.755 1.746c-.903-.033-1.454.295-1.521.339C7.379.646 9.659 0 11.984 0H12c2.334 0 4.605.646 6.766 2.085-.068-.046-.615-.372-1.52-.339C14.946 1.828 12 3.545 12 3.545v.006z";

// Logos oficiais (via simple-icons) onde existem; as demais lojas usam monograma no mesmo formato.
const ICONS: Record<string, string> = {
  steam: siSteam.path,
  epic: siEpicgames.path,
  gog: siGogdotcom.path,
  psstore: siPlaystation.path,
  xbox: XBOX_PATH,
};

const MONOGRAMS: Record<string, string> = { nuuvem: "NU", gmg: "GM", nintendo: "N" };

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-[55%]">
      <path fill="currentColor" d="M2 2h9.5v9.5H2zM12.5 2H22v9.5h-9.5zM2 12.5h9.5V22H2zM12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}

export function StoreLogo({ store, size = 28 }: { store: string; size?: number }) {
  const icon = ICONS[store];
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-[4px] bg-surface-3 text-text"
      style={{ width: size, height: size }}
    >
      {icon ? (
        <svg viewBox="0 0 24 24" className="size-[55%]">
          <path fill="currentColor" d={icon} />
        </svg>
      ) : store === "msstore" ? (
        <MicrosoftMark />
      ) : (
        <span className="font-display font-bold leading-none tracking-tight" style={{ fontSize: Math.max(11, size * 0.44) }}>
          {MONOGRAMS[store] ?? store.slice(0, 2).toUpperCase()}
        </span>
      )}
    </span>
  );
}

export function StoreName({ store, size }: { store: string; size?: number }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <StoreLogo store={store} size={size} />
      <span className="truncate font-medium">{getStore(store)?.name ?? store}</span>
    </span>
  );
}
