"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";

/**
 * "Compartilhar promo": no celular abre o menu de compartilhar do aparelho; no computador, um menu com copiar
 * link, WhatsApp, X e baixar o cartão (a mesma imagem da prévia do link).
 */
export function ShareButton({ url, text, imageUrl, filename }: { url: string; text: string; imageUrl: string; filename: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onClick() {
    // celulares têm o próprio menu de compartilhar (WhatsApp, Instagram, Telegram…); a prévia do link já leva o cartão
    if (typeof navigator !== "undefined" && "share" in navigator && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ text, url });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    setOpen((o) => !o);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // sem permissão para a área de transferência: o link continua no endereço do navegador
    }
  }

  // as opções abrem na mesma linha, ao lado do botão: o cabeçalho da página corta (overflow) qualquer menu que caia para fora dele
  const item = "inline-flex items-center rounded-[4px] border border-line bg-bg/60 px-2.5 py-1.5 text-sm text-text-2 transition hover:border-accent hover:text-accent";
  return (
    <div ref={ref} className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex items-center gap-2 rounded-[4px] border border-line-strong bg-bg/60 px-3 py-1.5 text-sm font-medium text-text transition hover:border-accent hover:text-accent"
      >
        <Icon name="share" className="size-4" />
        Compartilhar
      </button>
      {open && (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={copy} className={item}>
            {copied ? "Link copiado!" : "Copiar link"}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer" className={item}>
            WhatsApp
          </a>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className={item}>
            X (Twitter)
          </a>
          <a href={imageUrl} download={filename} className={item}>
            Baixar imagem
          </a>
        </div>
      )}
    </div>
  );
}
