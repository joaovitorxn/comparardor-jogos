import type { ExternalIds, SimilarGame, TimeToBeat } from "@/db/schema";
import { fetchJson } from "./http";

/**
 * IGDB (Twitch) — metadados e, principalmente, os IDs do mesmo jogo em cada loja.
 * Docs: https://api-docs.igdb.com/ — limite de 4 req/s; consultas na linguagem "Apicalypse".
 */
const API = "https://api.igdb.com/v4";

/** IDs de `external_game_source` no IGDB. */
const SOURCE = { steam: 1, gog: 5, microsoft: 11, epic: 26, xboxMarketplace: 31, psStoreUs: 36 } as const;

export function isIgdbConfigured() {
  return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
}

// token de app (client credentials) vale ~60 dias; guardamos em memória até perto de expirar
let token: { value: string; expiresAt: number } | null = null;

async function getToken() {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const qs = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID!,
    client_secret: process.env.TWITCH_CLIENT_SECRET!,
    grant_type: "client_credentials",
  });
  const res = await fetchJson<{ access_token: string; expires_in: number }>(`https://id.twitch.tv/oauth2/token?${qs}`, {
    init: { method: "POST" },
  });
  token = { value: res.access_token, expiresAt: Date.now() + res.expires_in * 1000 };
  return token.value;
}

let lastRequest = 0;

async function query<T>(endpoint: string, body: string): Promise<T> {
  if (!isIgdbConfigured()) throw new Error("TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET não configurados no .env");
  // respeita 4 req/s
  const wait = lastRequest + 260 - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequest = Date.now();

  return fetchJson<T>(`${API}/${endpoint}`, {
    init: {
      method: "POST",
      headers: { "Client-ID": process.env.TWITCH_CLIENT_ID!, Authorization: `Bearer ${await getToken()}` },
      body,
    },
  });
}

const quote = (values: (string | number)[]) => values.map((v) => `"${String(v).replace(/"/g, "")}"`).join(",");

/** appid da Steam → id do jogo no IGDB. */
export async function lookupIgdbIds(steamAppIds: number[]): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  for (let i = 0; i < steamAppIds.length; i += 100) {
    const batch = steamAppIds.slice(i, i + 100);
    const rows = await query<{ game: number; uid: string }[]>(
      "external_games",
      `fields game,uid; where uid = (${quote(batch)}) & external_game_source = ${SOURCE.steam}; limit 500;`,
    );
    for (const row of rows) result.set(Number(row.uid), row.game);
  }
  return result;
}

// ---------- rótulos em português ----------

const MODE_PT: Record<string, string> = {
  "Single player": "Um jogador",
  Multiplayer: "Multijogador",
  "Co-operative": "Cooperativo",
  "Split screen": "Tela dividida",
  "Massively Multiplayer Online (MMO)": "MMO",
  "Battle Royale": "Battle royale",
};

const THEME_PT: Record<string, string> = {
  Action: "Ação",
  Fantasy: "Fantasia",
  "Science fiction": "Ficção científica",
  Horror: "Terror",
  Thriller: "Suspense",
  Survival: "Sobrevivência",
  Historical: "Histórico",
  Stealth: "Furtividade",
  Comedy: "Comédia",
  Business: "Negócios",
  Drama: "Drama",
  "Non-fiction": "Não ficção",
  Sandbox: "Sandbox",
  Educational: "Educativo",
  Kids: "Infantil",
  "Open world": "Mundo aberto",
  Warfare: "Guerra",
  Party: "Festa",
  "4X (explore, expand, exploit, and exterminate)": "4X",
  Mystery: "Mistério",
  Romance: "Romance",
};

const PERSPECTIVE_PT: Record<string, string> = {
  "First person": "Primeira pessoa",
  "Third person": "Terceira pessoa",
  "Bird view / Isometric": "Isométrica",
  "Side view": "Visão lateral",
  Text: "Texto",
  Auditory: "Auditiva",
  "Virtual Reality": "Realidade virtual",
};

const PLATFORM_LABEL: Record<string, string> = {
  XONE: "Xbox One",
  "Series X|S": "Xbox Series X|S",
  WiiU: "Wii U",
  Mac: "macOS",
  PC: "PC",
};

/** Plataformas em ordem de relevância para o público daqui. */
const PLATFORM_ORDER = ["PC", "PS5", "PS4", "Xbox Series X|S", "Xbox One", "Switch 2", "Switch", "macOS", "Linux", "iOS", "Android"];

const translate = (dict: Record<string, string>, names: { name: string }[] | undefined) =>
  (names ?? []).map((n) => dict[n.name] ?? n.name);

// ---------- detalhes ----------

interface IgdbGame {
  id: number;
  platforms?: { abbreviation?: string; name: string }[];
  game_modes?: { name: string }[];
  themes?: { name: string }[];
  player_perspectives?: { name: string }[];
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  similar_games?: { id: number; name: string; cover?: { image_id: string } }[];
  external_games?: { uid: string; external_game_source: number }[];
}

export interface IgdbDetails {
  igdbId: number;
  platforms: string[];
  gameModes: string[];
  themes: string[];
  perspectives: string[];
  criticRating: number | null;
  criticRatingCount: number | null;
  timeToBeat: TimeToBeat | null;
  similarGames: SimilarGame[];
  externalIds: ExternalIds;
}

export function igdbImageUrl(imageId: string, size: "cover_big" | "cover_big_2x" | "1080p" | "screenshot_med" = "cover_big") {
  return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
}

export async function fetchIgdbDetails(igdbIds: number[]): Promise<IgdbDetails[]> {
  const result: IgdbDetails[] = [];

  for (let i = 0; i < igdbIds.length; i += 50) {
    const batch = igdbIds.slice(i, i + 50);
    const [games, ttb] = await Promise.all([
      query<IgdbGame[]>(
        "games",
        `fields platforms.abbreviation,platforms.name,game_modes.name,themes.name,player_perspectives.name,
         aggregated_rating,aggregated_rating_count,similar_games.name,similar_games.cover.image_id,
         external_games.uid,external_games.external_game_source;
         where id = (${batch.join(",")}); limit 50;`,
      ),
      query<{ game_id: number; hastily?: number; normally?: number; completely?: number; count?: number }[]>(
        "game_time_to_beats",
        `fields game_id,hastily,normally,completely,count; where game_id = (${batch.join(",")}); limit 50;`,
      ),
    ]);

    // appid da Steam dos jogos parecidos, para linkar os que já estão no catálogo
    const similarIds = [...new Set(games.flatMap((g) => g.similar_games?.map((s) => s.id) ?? []))];
    const similarSteam = new Map<number, number>();
    for (let j = 0; j < similarIds.length; j += 200) {
      const rows = await query<{ game: number; uid: string }[]>(
        "external_games",
        `fields game,uid; where game = (${similarIds.slice(j, j + 200).join(",")}) & external_game_source = ${SOURCE.steam}; limit 500;`,
      );
      for (const row of rows) if (!similarSteam.has(row.game)) similarSteam.set(row.game, Number(row.uid));
    }

    const ttbByGame = new Map(ttb.map((t) => [t.game_id, t]));
    for (const g of games) {
      const ext = g.external_games ?? [];
      const uids = (source: number) => [...new Set(ext.filter((e) => e.external_game_source === source).map((e) => e.uid))];
      const t = ttbByGame.get(g.id);
      const platforms = [...new Set((g.platforms ?? []).map((p) => PLATFORM_LABEL[p.abbreviation ?? ""] ?? p.abbreviation ?? p.name))];
      const rank = (p: string) => (PLATFORM_ORDER.indexOf(p) + 1 || 99);

      result.push({
        igdbId: g.id,
        platforms: platforms.sort((a, b) => rank(a) - rank(b)),
        gameModes: translate(MODE_PT, g.game_modes),
        themes: translate(THEME_PT, g.themes),
        perspectives: translate(PERSPECTIVE_PT, g.player_perspectives),
        criticRating: g.aggregated_rating != null ? Math.round(g.aggregated_rating) : null,
        criticRatingCount: g.aggregated_rating_count ?? null,
        timeToBeat: t
          ? { hastily: t.hastily ?? null, normally: t.normally ?? null, completely: t.completely ?? null, count: t.count ?? 0 }
          : null,
        similarGames: (g.similar_games ?? []).map((s) => ({
          igdbId: s.id,
          name: s.name,
          coverImageId: s.cover?.image_id ?? null,
          steamAppId: similarSteam.get(s.id) ?? null,
        })),
        externalIds: {
          gog: uids(SOURCE.gog)[0],
          epic: uids(SOURCE.epic),
          xbox: [...new Set([...uids(SOURCE.microsoft), ...uids(SOURCE.xboxMarketplace)])],
          psstore: uids(SOURCE.psStoreUs),
        },
      });
    }
  }
  return result;
}

// ---------- exclusivos de console ----------

/** Plataformas no IGDB: PlayStation 4/5 e Switch/Switch 2 (as que queremos) e as que descartam o "exclusivo". */
const CONSOLE_PLATFORMS = [48, 167, 130, 508];
const OTHER_PLATFORMS = [6, 14, 3, 49, 169]; // Windows, Mac, Linux, Xbox One, Xbox Series

const GENRE_PT: Record<string, string> = {
  Adventure: "Aventura",
  Indie: "Indie",
  Shooter: "Tiro",
  Puzzle: "Quebra-cabeça",
  "Role-playing (RPG)": "RPG",
  Platform: "Plataforma",
  Fighting: "Luta",
  Racing: "Corrida",
  Simulator: "Simulação",
  Sport: "Esportes",
  Strategy: "Estratégia",
  "Hack and slash/Beat 'em up": "Hack and slash",
  "Turn-based strategy (TBS)": "Estratégia por turnos",
  "Real Time Strategy (RTS)": "Estratégia em tempo real",
  "Card & Board Game": "Cartas e tabuleiro",
  "Visual Novel": "Visual novel",
  Arcade: "Arcade",
  "Music": "Música",
  "Point-and-click": "Point-and-click",
  Tactical: "Tático",
  Pinball: "Pinball",
  Quiz: "Quiz",
  "MOBA": "MOBA",
};

export interface IgdbExclusive {
  igdbId: number;
  title: string;
  summary: string | null;
  releaseTimestamp: number | null;
  coverImageId: string | null;
  heroImageId: string | null;
  genres: string[];
  developers: string[];
  publishers: string[];
  screenshotImageIds: string[];
  ratingCount: number;
}

interface IgdbExclusiveRow {
  id: number;
  name: string;
  summary?: string;
  first_release_date?: number;
  cover?: { image_id: string };
  artworks?: { image_id: string }[];
  screenshots?: { image_id: string }[];
  genres?: { name: string }[];
  involved_companies?: { developer?: boolean; publisher?: boolean; company?: { name: string } }[];
  total_rating_count?: number;
}

/**
 * Jogos que só saem em PlayStation e/ou Nintendo (sem versão de PC, Mac, Linux ou Xbox), do mais
 * avaliado para o menos. `offset` permite continuar de onde parou.
 */
export async function fetchConsoleExclusives({ limit, offset = 0, minRatings = 15 }: { limit: number; offset?: number; minRatings?: number }): Promise<IgdbExclusive[]> {
  const rows = await query<IgdbExclusiveRow[]>(
    "games",
    `fields name,summary,first_release_date,cover.image_id,artworks.image_id,screenshots.image_id,genres.name,
       involved_companies.developer,involved_companies.publisher,involved_companies.company.name,total_rating_count;
     where platforms = (${CONSOLE_PLATFORMS.join(",")}) & platforms != (${OTHER_PLATFORMS.join(",")})
       & game_type = 0 & total_rating_count >= ${minRatings} & cover != null;
     sort total_rating_count desc; limit ${limit}; offset ${offset};`,
  );
  const names = (list: IgdbExclusiveRow["involved_companies"], role: "developer" | "publisher") =>
    [...new Set((list ?? []).filter((c) => c[role] && c.company).map((c) => c.company!.name))];
  return rows.map((g) => ({
    igdbId: g.id,
    title: g.name,
    summary: g.summary ?? null,
    releaseTimestamp: g.first_release_date ?? null,
    coverImageId: g.cover?.image_id ?? null,
    heroImageId: g.artworks?.[0]?.image_id ?? g.screenshots?.[0]?.image_id ?? null,
    genres: (g.genres ?? []).map((x) => GENRE_PT[x.name] ?? x.name),
    developers: names(g.involved_companies, "developer"),
    publishers: names(g.involved_companies, "publisher"),
    screenshotImageIds: (g.screenshots ?? []).slice(0, 8).map((s) => s.image_id),
    ratingCount: g.total_rating_count ?? 0,
  }));
}
