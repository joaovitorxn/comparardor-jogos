"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GameMedia } from "@/db/schema";
import { TrailerPlayer } from "./trailer-player";

interface Props {
  screenshots: GameMedia[];
  videos: GameMedia[];
  title: string;
  storeUrl: string | null;
}

export function MediaGallery({ screenshots, videos, title, storeUrl }: Props) {
  // trailers primeiro, como na Steam; o palco abre no primeiro item
  const items = [...videos, ...screenshots];
  const [active, setActive] = useState(0);
  // só o trailer que abre com a página toca sozinho; os que a pessoa escolhe esperam o play
  const [interacted, setInteracted] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  // quem abriu o lightbox: o foco volta para lá ao fechar (alguns navegadores não devolvem sozinhos)
  const openerRef = useRef<HTMLElement | null>(null);

  const current = items[active];
  // a miniatura da Steam é pequena demais para o palco; a primeira screenshot vira a capa do trailer
  const poster = screenshots[0]?.url ?? null;

  const select = useCallback(
    (index: number) => {
      const next = (index + items.length) % items.length;
      setActive(next);
      setInteracted(true);
      stripRef.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    },
    [items.length],
  );

  const stepLightbox = useCallback(
    (delta: number) => setLightbox((i) => (i == null ? i : (i + delta + screenshots.length) % screenshots.length)),
    [screenshots.length],
  );

  useEffect(() => {
    if (lightbox == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") stepLightbox(1);
      if (e.key === "ArrowLeft") stepLightbox(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, stepLightbox]);

  if (!current) return null;
  const screenshotIndex = current.type === "screenshot" ? active - videos.length : -1;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      {/* palco */}
      <div className="relative aspect-video bg-black">
        {current.type === "video" ? (
          <TrailerPlayer key={current.id} src={current.url} poster={poster} title={current.title ?? "Trailer"} fallbackUrl={storeUrl} autoplayMuted={!interacted && active === 0} />
        ) : (
          <button
            type="button"
            onClick={(e) => {
              openerRef.current = e.currentTarget;
              setLightbox(screenshotIndex);
            }}
            aria-label="Ampliar imagem"
            className="group absolute inset-0 cursor-zoom-in"
          >
            <Image src={current.url} alt={`Screenshot ${screenshotIndex + 1} de ${title}`} fill sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />
          </button>
        )}

        {items.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Mídia anterior"
              onClick={() => select(active - 1)}
              className="absolute left-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-xl text-white transition hover:bg-black/80"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Próxima mídia"
              onClick={() => select(active + 1)}
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-xl text-white transition hover:bg-black/80"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* faixa de miniaturas */}
      <div ref={stripRef} className="scroll-slim flex gap-2 overflow-x-auto p-2" role="group" aria-label="Imagens e vídeos">
        {items.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-current={i === active ? "true" : undefined}
            aria-label={item.type === "video" ? `Trailer: ${item.title ?? ""}` : `Screenshot ${i - videos.length + 1}`}
            onClick={() => select(i)}
            className={`relative aspect-video w-32 shrink-0 overflow-hidden rounded-[3px] border-2 transition sm:w-36 ${
              i === active ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
            }`}
          >
            {item.thumbUrl && <Image src={item.thumbUrl} alt="" fill sizes="144px" className="object-cover" />}
            {item.type === "video" && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-ink">
                  <svg viewBox="0 0 24 24" aria-hidden className="ml-0.5 size-3.5">
                    <path fill="currentColor" d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
                  </svg>
                </span>
              </span>
            )}
          </button>
        ))}
      </div>

      {lightbox != null && (
        // <dialog> nativo: o foco vai para dentro ao abrir, fica preso nele, Esc fecha e o foco volta ao botão que abriu
        <dialog
          ref={(el) => {
            if (el && !el.open) el.showModal();
          }}
          onClose={() => {
            setLightbox(null);
            openerRef.current?.focus();
          }}
          onClick={(e) => e.target === e.currentTarget && e.currentTarget.close()}
          aria-label={`Screenshot ${lightbox + 1} de ${screenshots.length}`}
          className="fixed inset-0 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center bg-black/95 p-4 text-white backdrop:bg-black"
        >
          <div className="relative aspect-video w-full max-w-6xl">
            <Image src={screenshots[lightbox].url} alt="" fill sizes="100vw" className="object-contain" priority />
          </div>
          <button
            type="button"
            autoFocus
            aria-label="Fechar"
            onClick={(e) => e.currentTarget.closest("dialog")?.close()}
            className="absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
          >
            ×
          </button>
          <button type="button" aria-label="Anterior" onClick={() => stepLightbox(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20">
            ‹
          </button>
          <button type="button" aria-label="Próxima" onClick={() => stepLightbox(1)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-2xl text-white hover:bg-white/20">
            ›
          </button>
          <span className="absolute bottom-4 text-sm text-white/70">
            {lightbox + 1} / {screenshots.length} · Esc para fechar
          </span>
        </dialog>
      )}
    </div>
  );
}
