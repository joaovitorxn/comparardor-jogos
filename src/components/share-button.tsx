"use client";

import { useRef, useState } from "react";
import { Icon } from "./icon";
import { buttonStyles } from "./ui";

interface Props {
  /** Endereço da página do jogo (o que vai no link). */
  url: string;
  /** Frase que acompanha o link e a imagem. */
  text: string;
  /** Cartão vertical do jogo (JPEG). */
  imageUrl: string;
  filename: string;
}

/**
 * "Compartilhar": abre uma janela com a prévia do cartão da promoção e as ações: baixar a imagem, compartilhá-la
 * (menu do aparelho, com a imagem anexada quando o navegador permite) e copiar o link.
 */
export function ShareButton({ url, text, imageUrl, filename }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  function show() {
    setCanShare("share" in navigator);
    setNote(null);
    setOpen(true);
    dialog.current?.showModal();
  }

  function hide() {
    dialog.current?.close();
  }

  function flash(message: string) {
    setNote(message);
    setTimeout(() => setNote((n) => (n === message ? null : n)), 2200);
  }

  async function share() {
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text} ${url}` });
      } else {
        await navigator.share({ text, url });
      }
    } catch (err) {
      // fechar o menu de compartilhar não é erro
      if ((err as Error).name !== "AbortError") flash("Não deu para compartilhar. Baixe a imagem e envie por lá.");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      flash("Link copiado!");
    } catch {
      flash("Não consegui copiar. O link está no endereço da página.");
    }
  }

  const secondary =
    "inline-flex items-center justify-center gap-2 rounded-[4px] border border-line-strong px-3 py-2 text-sm font-medium text-text-2 transition hover:border-accent hover:text-accent";

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 rounded-[4px] border border-line-strong bg-bg/60 px-3 py-1.5 text-sm font-medium text-text transition hover:border-accent hover:text-accent"
      >
        <Icon name="share" className="size-4" />
        Compartilhar
      </button>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && hide()}
        aria-label="Compartilhar promoção"
        className="m-auto w-[min(92vw,24rem)] rounded-card border border-line-strong bg-surface-2 p-0 text-text shadow-2xl shadow-black/70 backdrop:bg-black/70"
      >
        {open && (
          <div className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-lg font-bold uppercase tracking-wide">Compartilhar promo</p>
              <button type="button" onClick={hide} aria-label="Fechar" className="-mr-1 p-1 text-2xl leading-none text-muted hover:text-text">
                ×
              </button>
            </div>

            <div className="skeleton relative mx-auto aspect-[4/5] max-h-[55vh] overflow-hidden rounded-[8px] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Prévia do cartão da promoção"
                onLoad={() => setLoaded(true)}
                className={`absolute inset-0 size-full object-contain transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
              />
            </div>

            <div className="mt-4 space-y-2">
              <a href={imageUrl} download={filename} className={`${buttonStyles.primary} w-full`}>
                Baixar imagem
              </a>
              {canShare ? (
                <button type="button" onClick={share} className={`${secondary} w-full`}>
                  Compartilhar…
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer" className={secondary}>
                    WhatsApp
                  </a>
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className={secondary}>
                    X (Twitter)
                  </a>
                </div>
              )}
              <button type="button" onClick={copy} className={`${secondary} w-full`}>
                Copiar link
              </button>
            </div>
            <p role="status" className="mt-2 h-4 text-center text-xs text-muted">
              {note}
            </p>
          </div>
        )}
      </dialog>
    </>
  );
}
