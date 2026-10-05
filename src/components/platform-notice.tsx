"use client";

import { PLATFORM_FAMILIES, type PlatformFamilyId } from "@/lib/stores";
import { usePlatforms } from "@/lib/use-platforms";
import { PlatformIcon } from "./store-logo";

/** Aviso fino de que a página está filtrada pelas "Minhas plataformas", com atalho para ver tudo. */
export function PlatformNotice({ platforms }: { platforms: PlatformFamilyId[] }) {
  const { setPlatforms } = usePlatforms();
  if (!platforms.length) return null;
  return (
    <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[4px] border border-accent-line bg-accent-soft px-3 py-2 text-xs text-text-2">
      <span className="flex items-center gap-1.5">
        {platforms.map((id) => (
          <PlatformIcon key={id} family={id} className="size-3.5 text-accent" />
        ))}
      </span>
      <span>
        Mostrando só o que vale para <strong className="font-semibold text-text">{platforms.map((id) => PLATFORM_FAMILIES.find((f) => f.id === id)!.label).join(", ")}</strong>.
      </span>
      <button type="button" onClick={() => setPlatforms([])} className="font-medium text-accent underline-offset-2 hover:underline">
        Mostrar todas
      </button>
    </p>
  );
}
