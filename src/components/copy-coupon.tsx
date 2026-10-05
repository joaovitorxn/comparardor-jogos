"use client";

import { useState } from "react";

export function CopyCoupon({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded border border-dashed border-coupon/60 px-1.5 py-0.5 font-mono text-xs text-coupon hover:bg-coupon/10"
      title="Copiar código"
    >
      {copied ? "Copiado" : code}
    </button>
  );
}
