import { siEpicgames, siGogdotcom, siPlaystation, siSteam } from "simple-icons";
import { getStore } from "@/lib/stores";

// Logos oficiais (via simple-icons) onde existem; as demais lojas usam monograma no mesmo formato.
const ICONS: Record<string, string> = {
  steam: siSteam.path,
  epic: siEpicgames.path,
  gog: siGogdotcom.path,
  psstore: siPlaystation.path,
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
      ) : store === "xbox" ? (
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
