"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PLATFORM_FAMILIES, type PlatformFamilyId } from "@/lib/stores";
import { usePlatforms } from "@/lib/use-platforms";
import { buttonStyles } from "./ui";
import { PlatformIcon } from "./store-logo";
import { THEME_KEY, ThemeToggle } from "./theme-toggle";

/** Marca que a pessoa já passou pelas boas-vindas, guardado no aparelho (sem conta). Se o armazenamento falhar, só não lembra. */
const KEY = "dropou:boas-vindas";

/** Páginas em que a janela não aparece: as legais, para quem chega só para ler. */
const SKIP = ["/privacidade", "/termos"];

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // sem armazenamento: a janela volta na próxima visita
  }
}

/**
 * Janela de boas-vindas na primeira visita: a pessoa escolhe as plataformas que joga e o tema do site.
 * Quem já tinha personalizado algo (plataformas ou tema) é contado como veterano e não vê a janela.
 * Para personalizar mais coisas no futuro, é só somar outra seção aqui.
 */
export function WelcomeDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const { platforms: saved, setPlatforms } = usePlatforms();
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<PlatformFamilyId[]>([]);

  useEffect(() => {
    if (SKIP.includes(pathname) || read(KEY)) return;
    // quem já mexeu em plataformas ou tema não é novato
    const veteran = saved.length > 0 || read(THEME_KEY);
    // marca como visto só quando a janela realmente abre (ou para veteranos): o React em dev roda este efeito duas vezes
    if (veteran) {
      markSeen();
      return;
    }
    // um respiro para a página entrar antes da janela
    const timer = window.setTimeout(() => {
      markSeen();
      setOpen(true);
      dialog.current?.showModal();
    }, 500);
    return () => window.clearTimeout(timer);
    // roda uma vez por página aberta; `saved` só importa na primeira leitura
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function toggle(id: PlatformFamilyId) {
    setChosen((c) => (c.includes(id) ? c.filter((p) => p !== id) : [...c, id]));
  }

  function hide() {
    dialog.current?.close();
  }

  function confirm() {
    if (chosen.length > 0) setPlatforms(chosen);
    hide();
  }

  return (
    <dialog
      ref={dialog}
      onClose={() => setOpen(false)}
      aria-labelledby="welcome-title"
      className="m-auto max-h-[90vh] w-[min(92vw,28rem)] overflow-y-auto rounded-card border border-line-strong bg-surface-2 p-0 text-text shadow-2xl shadow-black/70 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="space-y-5 p-5">
          <div>
            <p id="welcome-title" className="font-display text-2xl font-bold uppercase leading-tight tracking-wide">
              Parece que é sua primeira vez aqui
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-2">Deixe o Dropou do seu jeito. Leva um segundo e dá para mudar depois.</p>
          </div>

          <section>
            <p className="font-display text-sm font-semibold uppercase tracking-wider text-text">Onde você joga?</p>
            <p className="mt-0.5 text-xs text-muted">O site passa a mostrar só os jogos e os descontos dessas plataformas. Sem marcar nada, mostramos todas.</p>
            <ul className="mt-2.5 grid grid-cols-2 gap-1.5">
              {PLATFORM_FAMILIES.map((f) => {
                const checked = chosen.includes(f.id);
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggle(f.id)}
                      className={`flex w-full items-center gap-2.5 rounded-[4px] border px-3 py-2.5 text-left text-sm font-medium transition active:scale-[0.98] ${
                        checked ? "border-accent-line bg-accent-soft text-text" : "border-line text-text-2 hover:border-line-strong hover:text-text"
                      }`}
                    >
                      <PlatformIcon family={f.id} className="size-5 shrink-0" />
                      <span className="flex-1">{f.label}</span>
                      <span
                        aria-hidden
                        className={`flex size-4 shrink-0 items-center justify-center rounded-[3px] border ${checked ? "border-accent bg-accent text-accent-ink" : "border-line-strong"}`}
                      >
                        {checked && (
                          <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                            <path d="m5 12.5 4.5 4.5L19 7" />
                          </svg>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <p className="mb-2 font-display text-sm font-semibold uppercase tracking-wider text-text">Como prefere o site?</p>
            <ThemeToggle />
          </section>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={hide} className="rounded-[4px] px-3 py-2 text-sm font-medium text-muted transition hover:text-text">
              Agora não
            </button>
            <button type="button" onClick={confirm} className={`${buttonStyles.primary} px-6`}>
              Começar
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
