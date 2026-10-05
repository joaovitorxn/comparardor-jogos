"use client";

import { useWishlist } from "@/lib/wishlist";

export function WishlistButton({ gameId }: { gameId: number }) {
  const { has, add, remove } = useWishlist();
  const saved = has(gameId);
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => (saved ? remove(gameId) : add(gameId))}
      className={`inline-flex items-center gap-2 rounded-[4px] border px-3 py-1.5 text-sm font-medium transition ${
        saved ? "border-accent-line bg-accent-soft text-accent" : "border-line-strong bg-bg/60 text-text hover:border-accent hover:text-accent"
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
        <path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6c-2.3 4.6-9.3 9-9.3 9Z" />
      </svg>
      {saved ? "Na sua lista" : "Salvar na lista"}
    </button>
  );
}
