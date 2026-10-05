"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string | null;
  title: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

/** Capa do jogo com placeholder (título sobre fundo neutro) se a imagem não existir ou falhar. */
export function CoverImage({ src, title, sizes, priority, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="absolute inset-0 flex items-end bg-gradient-to-br from-surface-2 to-surface p-3">
        <span className="line-clamp-3 text-sm font-semibold leading-tight text-muted">{title}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={`Capa de ${title}`}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
