import Link from "next/link";
import { Icon, type IconName } from "./icon";

/** Os principais gêneros do catálogo (o texto é o mesmo que a Steam usa e que o filtro de gênero da busca compara). */
const GENRES: { name: string; icon: IconName }[] = [
  { name: "Ação", icon: "burst" },
  { name: "Aventura", icon: "mountain" },
  { name: "RPG", icon: "sword" },
  { name: "Indie", icon: "palette" },
  { name: "Simulação", icon: "plane" },
  { name: "Estratégia", icon: "tower" },
  { name: "Corrida", icon: "racecar" },
  { name: "Esportes", icon: "soccer" },
];

const number = new Intl.NumberFormat("pt-BR");

/** Botões grandes de categorias: cada um leva à busca já filtrada pelo gênero (e pelas plataformas escolhidas no cabeçalho). */
export function GenreTiles({ counts }: { counts: Record<string, number> }) {
  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
      {GENRES.map((g) => (
        <li key={g.name}>
          <Link
            href={`/busca?genero=${encodeURIComponent(g.name)}`}
            className="group flex items-center gap-4 rounded-card border border-line bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-accent-line hover:bg-surface-2"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[6px] border border-accent-line bg-accent-soft text-accent transition group-hover:bg-accent group-hover:text-accent-ink">
              <Icon name={g.icon} className="size-7" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-xl font-bold uppercase leading-tight tracking-wide group-hover:text-accent">{g.name}</span>
              {counts[g.name] != null && <span className="block text-xs text-muted">{number.format(counts[g.name])} jogos</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
