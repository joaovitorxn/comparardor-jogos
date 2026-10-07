import type { PcRequirements } from "@/db/schema";
import { parsePcRequirements } from "@/lib/requirements";
import { decodeHtmlEntities } from "@/lib/text";
import { fetchJson, HttpError } from "./http";
import type { OfferPrice, StoreCollector, StoreOffer } from "./types";

// API pública (não documentada) da loja. Não precisa de chave, mas limita ~200 req / 5 min.
const STORE_API = "https://store.steampowered.com/api";
const ASSETS_CDN = "https://shared.akamai.steamstatic.com/store_item_assets";
// "brazilian" = pt-BR ("portuguese" é pt-PT)
const PARAMS = "cc=br&l=brazilian";

interface SteamPriceOverview {
  currency: string;
  initial: number;
  final: number;
  discount_percent: number;
}

interface SteamAppData {
  type: string;
  name: string;
  steam_appid: number;
  is_free: boolean;
  short_description?: string;
  header_image?: string;
  background_raw?: string;
  website?: string | null;
  developers?: string[];
  publishers?: string[];
  genres?: { id: string; description: string }[];
  release_date?: { coming_soon: boolean; date: string };
  metacritic?: { score: number };
  price_overview?: SteamPriceOverview;
  screenshots?: { id: number; path_thumbnail: string; path_full: string }[];
  movies?: { id: number; name: string; thumbnail: string; hls_h264?: string }[];
  /** Objeto com HTML, ou [] quando o jogo não informa requisitos. */
  pc_requirements?: { minimum?: string; recommended?: string } | [];
}

type AppDetailsResponse = Record<string, { success: boolean; data?: SteamAppData | [] }>;

export interface SteamSearchItem {
  appId: number;
  name: string;
  imageUrl: string;
  price: { currency: string; initial: number; final: number } | null;
}

export interface SteamGameDetails {
  appId: number;
  title: string;
  shortDescription: string | null;
  developers: string[];
  publishers: string[];
  genres: string[];
  releaseDate: string | null;
  coverUrl: string | null;
  headerUrl: string | null;
  backgroundUrl: string | null;
  metacritic: number | null;
  website: string | null;
  screenshots: { url: string; thumbUrl: string }[];
  videos: { url: string; thumbUrl: string; title: string }[];
  requirements: PcRequirements | null;
  offer: StoreOffer;
}

function toPrice(p: SteamPriceOverview | undefined, isFree: boolean): OfferPrice | null {
  if (p) {
    return {
      currency: p.currency,
      priceCents: p.final,
      regularPriceCents: p.initial,
      discountPercent: p.discount_percent,
    };
  }
  return isFree ? { currency: "BRL", priceCents: 0, regularPriceCents: 0, discountPercent: 0 } : null;
}

export function steamStoreUrl(appId: number | string) {
  return `https://store.steampowered.com/app/${appId}/`;
}

/** Os 100 jogos com mais jogadores simultâneos na Steam agora. */
export async function fetchMostPlayedAppIds(): Promise<number[]> {
  const res = await fetchJson<{ response: { ranks: { appid: number }[] } }>(
    "https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/",
  );
  return res.response.ranks.map((r) => r.appid);
}

export async function searchSteam(term: string): Promise<SteamSearchItem[]> {
  const res = await fetchJson<{ items: { type: string; id: number; name: string; tiny_image: string; price?: SteamSearchItem["price"] }[] }>(
    `${STORE_API}/storesearch/?term=${encodeURIComponent(term)}&${PARAMS}`,
  );
  return res.items
    .filter((i) => i.type === "app")
    .map((i) => ({ appId: i.id, name: i.name, imageUrl: i.tiny_image, price: i.price ?? null }));
}

interface SteamAssets {
  asset_url_format: string;
  library_capsule_2x?: string;
  library_capsule?: string;
  library_hero_2x?: string;
  library_hero?: string;
}

interface StoreItemResponse {
  appid: number;
  name?: string;
  /** 0 = jogo, 1 = demo, 4 = DLC/trilha sonora... */
  type?: number;
  visible?: boolean;
  assets?: SteamAssets;
  best_purchase_option?: { final_price_in_cents?: string; original_price_in_cents?: string; discount_pct?: number };
  is_free?: boolean;
}

export interface SteamStoreItem {
  appId: number;
  name: string;
  isGame: boolean;
  /** Capa vertical. Apps recentes guardam arquivos em caminhos com hash, então só esta API sabe a URL. */
  coverUrl: string | null;
  heroUrl: string | null;
  price: OfferPrice | null;
}

/** Tipo, capas e preço de vários apps numa chamada só (IStoreBrowseService). */
export async function getSteamStoreItems(appIds: number[]): Promise<Map<number, SteamStoreItem>> {
  const result = new Map<number, SteamStoreItem>();
  for (let i = 0; i < appIds.length; i += 50) {
    const input = {
      ids: appIds.slice(i, i + 50).map((appid) => ({ appid })),
      context: { language: "brazilian", country_code: "BR" },
      data_request: { include_assets: true },
    };
    const res = await fetchJson<{ response: { store_items?: StoreItemResponse[] } }>(
      `https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?input_json=${encodeURIComponent(JSON.stringify(input))}`,
    );
    for (const item of res.response.store_items ?? []) {
      const assets = item.assets;
      const url = (file?: string) => (assets && file ? `${ASSETS_CDN}/${assets.asset_url_format.replace("${FILENAME}", file)}` : null);
      const option = item.best_purchase_option;
      const final = option?.final_price_in_cents != null ? Number(option.final_price_in_cents) : null;
      result.set(item.appid, {
        appId: item.appid,
        name: item.name ?? "",
        isGame: item.type === 0 && item.visible !== false,
        coverUrl: url(assets?.library_capsule_2x ?? assets?.library_capsule),
        // arte de fundo em 1x (~1920px): a 2x passa de 1 MB e fica atrás de um degradê de qualquer forma
        heroUrl: url(assets?.library_hero ?? assets?.library_hero_2x),
        price:
          final != null
            ? { currency: "BRL", priceCents: final, regularPriceCents: Number(option?.original_price_in_cents ?? final), discountPercent: option?.discount_pct ?? 0 }
            : item.is_free
              ? { currency: "BRL", priceCents: 0, regularPriceCents: 0, discountPercent: 0 }
              : null,
      });
    }
  }
  return result;
}

/** Busca na Steam devolvendo só jogos (sem DLCs, demos e trilhas sonoras), já com capa e preço. */
export async function searchSteamGames(term: string): Promise<SteamStoreItem[]> {
  const results = await searchSteam(term);
  if (!results.length) return [];
  const items = await getSteamStoreItems(results.map((r) => r.appId));
  return results.flatMap((r) => {
    const item = items.get(r.appId);
    return item?.isGame ? [{ ...item, name: item.name || r.name }] : [];
  });
}

/**
 * Jogos ainda não lançados com desconto de pré-venda na Steam (a própria busca da loja filtra
 * "em breve" + "em oferta"). Devolve só os appids, para importar no catálogo.
 */
export async function fetchPreorderDealAppIds(limit = 50): Promise<number[]> {
  const qs = new URLSearchParams({ query: "", start: "0", count: String(limit), filter: "comingsoon", specials: "1", category1: "998", cc: "br", l: "brazilian", infinite: "1" });
  const res = await fetchJson<{ results_html: string }>(`https://store.steampowered.com/search/results/?${qs}`);
  const ids: number[] = [];
  // cada resultado é um <a data-ds-appid="..."> e o desconto vem em data-discount
  for (const block of res.results_html.split("<a ").slice(1)) {
    const id = block.match(/data-ds-appid="(\d+)"/)?.[1];
    const discount = Number(block.match(/data-discount="(\d+)"/)?.[1] ?? 0);
    if (id && discount > 0) ids.push(Number(id));
  }
  return ids;
}

/**
 * Os `count` jogos mais vendidos da Steam, do mais ao menos vendido (a própria busca da loja, filtro
 * "mais vendidos", só jogos). Serve para pré-carregar o catálogo com o que as pessoas mais compram.
 */
export async function fetchTopSellerAppIds(count: number): Promise<number[]> {
  const ids: number[] = [];
  for (let start = 0; ids.length < count; start += 100) {
    const qs = new URLSearchParams({ query: "", start: String(start), count: "100", filter: "topsellers", category1: "998", cc: "br", l: "brazilian", infinite: "1" });
    let res: { results_html: string };
    try {
      res = await fetchJson<{ results_html: string }>(`https://store.steampowered.com/search/results/?${qs}`, { retries: 4 });
    } catch (err) {
      // limite da Steam: devolve o que já foi coletado em vez de perder tudo
      if (err instanceof HttpError && err.status === 429 && ids.length) break;
      throw err;
    }
    const page = [...res.results_html.matchAll(/data-ds-appid="(\d+)"/g)].map((m) => Number(m[1]));
    if (!page.length) break;
    ids.push(...page);
    await new Promise((r) => setTimeout(r, 1500));
  }
  return [...new Set(ids)].slice(0, count);
}

/** Detalhes completos de um app — é a nossa fonte principal de metadados e mídia por enquanto. */
export async function getSteamGameDetails(appId: number): Promise<SteamGameDetails | null> {
  const [res, item] = await Promise.all([
    fetchJson<AppDetailsResponse>(`${STORE_API}/appdetails?appids=${appId}&${PARAMS}`),
    getSteamStoreItems([appId]).then((m) => m.get(appId) ?? null).catch(() => null),
  ]);
  const entry = res[String(appId)];
  if (!entry?.success || !entry.data || Array.isArray(entry.data)) return null;
  const d = entry.data;
  // só jogos entram no catálogo (DLCs, demos e trilhas sonoras ficam de fora)
  if (d.type !== "game") return null;
  const assets = { coverUrl: item?.coverUrl ?? null, heroUrl: item?.heroUrl ?? null };

  return {
    appId,
    title: d.name,
    shortDescription: d.short_description ? decodeHtmlEntities(d.short_description) : null,
    developers: d.developers ?? [],
    publishers: d.publishers ?? [],
    genres: (d.genres ?? []).map((g) => g.description),
    releaseDate: d.release_date?.date || null,
    // sem capa vertical, cai para o header horizontal (o card recorta com object-cover)
    coverUrl: assets.coverUrl ?? d.header_image ?? null,
    headerUrl: d.header_image ?? null,
    backgroundUrl: assets.heroUrl ?? d.background_raw ?? null,
    metacritic: d.metacritic?.score ?? null,
    website: d.website || null,
    screenshots: (d.screenshots ?? []).map((s) => ({ url: s.path_full, thumbUrl: s.path_thumbnail })),
    videos: (d.movies ?? [])
      .filter((m) => m.hls_h264)
      .map((m) => ({ url: m.hls_h264!, thumbUrl: m.thumbnail, title: m.name })),
    requirements: parsePcRequirements(d.pc_requirements),
    offer: {
      store: "steam",
      storeProductId: String(appId),
      title: d.name,
      platform: "pc",
      drm: "steam",
      isKey: false,
      url: steamStoreUrl(appId),
      price: toPrice(d.price_overview, d.is_free),
    },
  };
}

export const steamCollector: StoreCollector = {
  store: "steam",

  async findByTitle(title) {
    const items = await searchSteam(title);
    return items.map((i) => ({
      store: "steam",
      storeProductId: String(i.appId),
      title: i.name,
      platform: "pc",
      drm: "steam",
      isKey: false,
      url: steamStoreUrl(i.appId),
      price: i.price
        ? {
            currency: i.price.currency,
            priceCents: i.price.final,
            regularPriceCents: i.price.initial,
            discountPercent: i.price.initial > 0 ? Math.round((1 - i.price.final / i.price.initial) * 100) : 0,
          }
        : null,
    }));
  },

  async fetchPrices(productIds) {
    const result = new Map<string, OfferPrice | null>();
    // com filters=price_overview a Steam aceita vários appids numa chamada só
    for (let i = 0; i < productIds.length; i += 50) {
      const batch = productIds.slice(i, i + 50);
      const res = await fetchJson<AppDetailsResponse>(
        `${STORE_API}/appdetails?appids=${batch.join(",")}&filters=price_overview&${PARAMS}`,
      );
      for (const id of batch) {
        const data = res[id]?.data;
        const overview = data && !Array.isArray(data) ? data.price_overview : undefined;
        result.set(id, toPrice(overview, false));
      }
    }
    return result;
  },
};

/**
 * Compatibilidade com o Steam Deck, segundo a Valve (a mesma consulta que a loja usa): 3 = Verificado,
 * 2 = Jogável, 1 = Não suportado, 0 = ainda sem análise. Devolve null se a consulta falhar.
 */
export async function fetchDeckStatus(appId: number): Promise<number | null> {
  const res = await fetchJson<{ success?: number; results?: { resolved_category?: number } }>(
    `https://store.steampowered.com/saleaction/ajaxgetdeckappcompatibilityreport?nAppID=${appId}`,
  );
  const category = res.results?.resolved_category;
  return res.success === 1 && typeof category === "number" && category >= 0 && category <= 3 ? category : null;
}
