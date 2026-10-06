"use client";

import { useRef, useState } from "react";
import { Icon } from "./icon";
import { buttonStyles } from "./ui";

/** Logos oficiais (preenchidas), no mesmo tamanho dos ícones de traço. */
const BRAND_PATHS = {
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z",
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
};

function BrandIcon({ name }: { name: keyof typeof BRAND_PATHS }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill="currentColor">
      <path d={BRAND_PATHS[name]} />
    </svg>
  );
}

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
 * (menu do aparelho: a imagem sozinha ou o link com o texto) e copiar o link.
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

  // Imagem e texto juntos viram DUAS mensagens no WhatsApp do iPhone (ele separa os dois), então são dois botões: cada um é uma mensagem só
  async function shareImage() {
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], filename, { type: blob.type || "image/jpeg" });
      if (!navigator.canShare?.({ files: [file] })) {
        flash("Este aparelho não envia imagem direto. Baixe e envie por lá.");
        return;
      }
      await navigator.share({ files: [file] });
    } catch (err) {
      // fechar o menu de compartilhar não é erro
      if ((err as Error).name !== "AbortError") flash("Não deu para compartilhar. Baixe a imagem e envie por lá.");
    }
  }

  async function shareLink() {
    try {
      await navigator.share({ text, url });
    } catch (err) {
      if ((err as Error).name !== "AbortError") flash("Não deu para compartilhar. Copie o link.");
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

            <div className={`${loaded ? "bg-surface" : "skeleton"} relative mx-auto aspect-[4/5] max-h-[55vh] overflow-hidden rounded-[8px] border border-line`}>
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
                <Icon name="download" className="size-5" />
                Baixar imagem
              </a>
              {canShare ? (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={shareImage} className={secondary}>
                    <Icon name="photo" className="size-4" />
                    Enviar imagem
                  </button>
                  <button type="button" onClick={shareLink} className={secondary}>
                    <Icon name="share" className="size-4" />
                    Enviar link
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer" className={secondary}>
                    <BrandIcon name="whatsapp" />
                    WhatsApp
                  </a>
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className={secondary}>
                    <BrandIcon name="x" />
                    X (Twitter)
                  </a>
                </div>
              )}
              <button type="button" onClick={copy} className={`${secondary} w-full`}>
                <Icon name="link" className="size-4" />
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
