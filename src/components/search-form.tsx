import Form from "next/form";

export function SearchForm({ defaultValue, className = "", size = "md" }: { defaultValue?: string; className?: string; size?: "md" | "lg" }) {
  const lg = size === "lg";
  return (
    <Form action="/busca" className={`relative ${className}`} role="search">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted ${lg ? "left-4 size-5" : "left-3 size-4"}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Buscar jogo"
        aria-label="Buscar jogo"
        className={`w-full rounded-[4px] border border-line bg-surface text-text placeholder:text-muted transition focus:border-accent focus:bg-surface-2 focus:outline-none ${
          lg ? "h-12 pl-12 pr-4 text-base" : "h-9 pl-9 pr-3 text-sm"
        }`}
      />
    </Form>
  );
}
