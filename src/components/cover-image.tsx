"use client";

import { useState } from "react";
import { lightImage } from "@/lib/images";

interface Props {
  src: string | null;
  title: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

/**
 * Capa do jogo com placeholder (título sobre fundo neutro) se a imagem não existir ou falhar.
 * Para as capas da Steam oferece duas versões (300 e 600 px de largura) e o navegador escolhe pela tela:
 * telas comuns baixam a leve (um terço do peso), telas de alta densidade (retina) baixam a nítida.
 */
export function CoverImage({ src, title, sizes, priority, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-end bg-gradient-to-br from-surface-2 to-surface p-3">
        <span className="line-clamp-3 text-sm font-semibold leading-tight text-muted">{title}</span>
      </div>
    );
  }

  const light = lightImage(src);
  return (
    // <img> comum (e não next/image): as imagens já vêm prontas das lojas, e aqui precisamos do srcset com as duas versões
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={light !== src ? `${light} 300w, ${src} 600w` : undefined}
      sizes={light !== src ? sizes : undefined}
      alt={`Capa de ${title}`}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      onError={() => setFailed(true)}
      className={`absolute inset-0 size-full object-cover ${className}`}
    />
  );
}
