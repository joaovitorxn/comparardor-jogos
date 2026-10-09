"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type HlsType from "hls.js";

const INITIAL_VOLUME = 0.3;

interface Props {
  /** Playlist HLS (.m3u8) da Steam. */
  src: string;
  poster: string | null;
  title: string;
  fallbackUrl: string | null;
  /** Começa sozinho e sem som (só o primeiro trailer da galeria). Ignorado com "reduzir movimento" ou economia de dados. */
  autoplayMuted?: boolean;
}

/**
 * Trailers da Steam são HLS. Safari/iOS tocam nativamente; nos outros navegadores
 * usamos o hls.js, carregado só quando a pessoa aperta play (não pesa no carregamento da página).
 */
export function TrailerPlayer({ src, poster, title, fallbackUrl, autoplayMuted = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");

  // troca de trailer ou desmontagem: libera o stream anterior
  useEffect(() => {
    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  async function play(muted = false) {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    // trailers da Steam vêm masterizados alto — sempre começam em 30%
    video.volume = INITIAL_VOLUME;
    setState("loading");
    try {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      } else {
        // build completo: o "light" não tem alt-audio, e a Steam serve o áudio numa playlist separada
        const { default: Hls } = await import("hls.js");
        if (!Hls.isSupported()) throw new Error("HLS não suportado");
        const hls = new Hls({ capLevelToPlayerSize: true });
        hlsRef.current = hls;
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            hls.destroy();
            hlsRef.current = null;
            setState("error");
          }
        });
        hls.loadSource(src);
        hls.attachMedia(video);
      }
      await video.play();
      setState("playing");
    } catch (err) {
      // play() rejeitado por interrupção (ex.: trocou de mídia) não é erro de reprodução
      if (err instanceof DOMException && err.name === "AbortError") return;
      // autoplay barrado pelo navegador: volta ao botão de play, sem mensagem de erro
      if (muted && err instanceof DOMException && err.name === "NotAllowedError") {
        hlsRef.current?.destroy();
        hlsRef.current = null;
        setState("idle");
        return;
      }
      setState("error");
    }
  }

  // autoplay mudo ao abrir a página; a pessoa liga o som nos controles do vídeo
  useEffect(() => {
    if (!autoplayMuted) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // no próximo quadro (e cancelável): o React em desenvolvimento monta o efeito duas vezes
    const id = requestAnimationFrame(() => void play(true));
    return () => cancelAnimationFrame(id);
    // roda só na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative size-full bg-black">
      <video
        ref={videoRef}
        controls={state === "playing"}
        playsInline
        preload="none"
        aria-label={`Trailer: ${title}`}
        className={`size-full ${state === "playing" ? "" : "invisible"}`}
      />

      {state !== "playing" && (
        <div className="absolute inset-0">
          {poster && <Image src={poster} alt="" fill sizes="(min-width: 1024px) 520px, 100vw" className="object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />

          {state === "error" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center">
              <p className="text-sm text-text-2">Não foi possível reproduzir o trailer aqui.</p>
              {fallbackUrl && (
                <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-accent hover:underline">
                  Assistir na Steam ↗
                </a>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => play()}
              disabled={state === "loading"}
              aria-label={`Reproduzir trailer: ${title}`}
              className="group absolute inset-0 flex items-center justify-center"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-accent text-accent-ink shadow-2xl shadow-black/50 transition group-hover:scale-110 group-disabled:scale-100">
                {state === "loading" ? (
                  <span className="size-6 animate-spin rounded-full border-[3px] border-accent-ink border-t-transparent" />
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden className="ml-1 size-7">
                    <path fill="currentColor" d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
                  </svg>
                )}
              </span>
              <span className="absolute bottom-4 left-4 right-4 truncate text-left font-display text-lg font-semibold uppercase tracking-wide text-white">
                {title}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
