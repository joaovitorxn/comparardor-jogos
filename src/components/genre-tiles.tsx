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

/** Categorias em pílulas: cada uma leva à busca já filtrada pelo gênero (e pelas plataformas escolhidas no cabeçalho). */
export function GenreTiles({ counts }: { counts: Record<string, number> }) {
  return (
    <ul className="flex flex-wrap gap-2.5">
      {GENRES.map((g) => (
        <li key={g.name}>
          <Link
            href={`/busca?genero=${encodeURIComponent(g.name)}`}
            className="group inline-flex min-h-11 items-center gap-2.5 rounded-full border border-line-strong bg-surface py-1.5 pl-3 pr-4 transition duration-200 hover:border-accent hover:bg-accent-soft"
          >
            <Icon name={g.icon} className="size-5 text-accent" />
            <span className="font-display text-lg font-bold uppercase leading-none tracking-wide group-hover:text-accent">{g.name}</span>
            {counts[g.name] != null && <span className="tabular text-xs text-muted">{number.format(counts[g.name])}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
