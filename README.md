# comparador.jogos

Comparador de preços de jogos entre lojas digitais, com cupons aplicados no preço final.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind 4 · Drizzle ORM · SQLite/libsql (Turso em produção)

## Rodando localmente

```bash
npm install
cp .env.example .env
npm run db:push                     # cria as tabelas em data/app.db
npm run import -- "hollow knight"   # importa jogos (por nome ou appid da Steam)
npm run seed:coupons                # cupons de EXEMPLO para testar a interface
npm run dev                         # http://localhost:3000
```

A busca do site também encontra jogos fora do catálogo (pela Steam). Ao abrir um deles, ele é importado na hora: dados e preço da Steam em ~1s, e as outras lojas, histórico e IGDB em segundo plano, alguns segundos depois.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run import -- <appid \| "nome">` | Importa da Steam (metadados, mídia, preço) e procura o mesmo jogo nas outras lojas |
| `npm run import -- --all` | Reimporta o catálogo inteiro (útil depois de mudar um coletor) |
| `npm run sync:consoles` | Busca Xbox, PS Store e Nintendo para jogos do catálogo que ainda não têm essas lojas |
| `npm run seed -- --limit 3000` | Pré-carrega os jogos mais populares (ITAD + mais jogados da Steam). Pode ser interrompido e retomado; ~35 jogos/min por causa do limite da Steam |
| `npm run refresh` | Atualiza preços não verificados há mais de 60 min, sincroniza a ITAD e os metadados do IGDB com mais de 7 dias (`--all` para todos, `--store gog` para uma loja) |
| `npm run db:studio` | Abre o Drizzle Studio para ver/editar o banco |
| `npm run alerts:test` | Envia uma notificação de teste para o aparelho que criou o alerta mais recente |
| `npm test` | Testes (cupons, alertas, requisitos, formatação…) |
| `npm run typecheck` / `npm run lint` | Verificações estáticas |

## Alertas de preço

Sem cadastro: a pessoa ativa as notificações do navegador e o alerta fica ligado àquele aparelho (Web Push com chaves VAPID). Há dois tipos: **chegar a um preço-alvo** ou **qualquer queda de preço**. Depois de cada atualização de preços, `checkPriceAlerts` compara o menor preço de vitrine de cada jogo com os alertas. Ele avisa uma vez por preço, avisa de novo só se cair mais e rearma quando o preço volta a subir. Aparelhos que revogaram a permissão são removidos sozinhos.

A lista de desejos fica no `localStorage` do aparelho (página **Minha lista**). No iPhone, notificações só funcionam com o site instalado na tela de início (iOS 16.4+), e o site explica isso na hora de criar o alerta.

## Arquitetura

```
src/
  collectors/     um arquivo por loja, todos implementam StoreCollector (types.ts)
  services/       importação, casamento entre lojas e atualização de preços
  db/             schema (Drizzle), conexão e consultas das páginas
  lib/            preços/cupons, formatação, metadados das lojas
  app/            páginas: início, /busca, /jogo/[slug]
  components/     tabela de preços, galeria, cards
scripts/          CLIs de importação, atualização e seed
```

**Modelo de dados:**
- `games`: jogo canônico. Metadados e mídia da Steam; plataformas, modos, tempo para zerar, nota da crítica, jogos parecidos e IDs em outras lojas do IGDB
- `listings`: jogo + loja + plataforma + edição
- `price_snapshots`: nossas coletas; só grava quando o preço muda
- `price_history`: histórico de 5 anos importado da ITAD (alimenta o gráfico)
- `coupons`: regras (percentual/fixo, mínimo, teto, acumula com promoção?, validade)

**Design:** tema escuro único, com tokens em `src/app/globals.css`. Barlow Condensed nos títulos e preços, Inter no texto. O verde-limão é reservado para preço e ação principal, o azul para cupons. As cores do gráfico por loja (`--series-*`) foram validadas para daltonismo e contraste no fundo escuro. Para trocar uma delas, revalide a paleta.

## Lojas

| Loja | Status | Fonte |
|---|---|---|
| Steam | ✅ | API pública da loja (`appdetails`, `storesearch`, `IStoreBrowseService` para capas) |
| GOG | ✅ | `catalog.gog.com` + `api.gog.com/products/{id}/prices`; casada pelo id do IGDB ou, sem ele, pelo título |
| Epic, Nuuvem, GMG, Microsoft Store (PC) | ✅ | IsThereAnyDeal API (`ITAD_API_KEY`), casada pelo appid da Steam |
| Xbox | ✅ | `displaycatalog.mp.microsoft.com` pelos ids do IGDB; jogos Play Anywhere valem também para PC |
| PlayStation Store | ✅ | Leitura da página do concept (ids do IGDB), sem preços exclusivos de PS Plus; verificada a cada 12h, 40 por execução |
| Nintendo eShop | ✅ | Busca no índice do nintendo.com/pt-br + `api.ec.nintendo.com/v1/price` (nsuids das Américas); Switch e Switch 2 |

### Adicionando uma loja

1. Crie `src/collectors/<loja>.ts` implementando `findByTitle` e `fetchPrices`
2. Registre em `src/collectors/index.ts`
3. Mude o `status` para `"active"` em `src/lib/stores.ts`

## Notas e limitações

- A GOG é casada pelo id que o IGDB informa e, na falta dele, por título normalizado exato. O id do IGDB às vezes aponta para um produto antigo, fora de venda; por isso só é usado quando tem preço. As lojas via ITAD são casadas pelo appid da Steam.
- Textos do IGDB vêm em inglês. Modos, temas e perspectivas são traduzidos por um dicionário em `src/collectors/igdb.ts`; rótulos novos aparecem em inglês até serem adicionados lá.
- Quando a ITAD traz mais de uma oferta da mesma loja (ex.: edições diferentes na Nuuvem), mostramos só a mais barata.
- Os links das lojas via ITAD passam pelo redirecionador `itad.link`. Para monetizar, troque por links de afiliado próprios.
- Trailers da Steam são HLS: tocam nativamente onde há suporte (Safari, Chrome recente) e via hls.js nos demais, sempre começando em 30% de volume.
- **PS Store:** não tem API, e o site dela tem proteção contra robôs. Se ela bloquear o servidor (403/429), a rodada para e os últimos preços conhecidos continuam valendo. O resumo do agendador (`/api/cron/refresh`, visível nos logs do GitHub Actions) mostra o erro.
- **Plataformas:** a tabela de preços tem filtro por plataforma, lembrado no aparelho. O menor preço geral, os alertas e o gráfico ainda consideram todas as plataformas juntas.
- O catálogo nasce da Steam, então exclusivos de console (ex.: Zelda, God of War antes do PC) ainda não entram.
- O limite de importações pela busca (`src/app/steam/[appid]/route.ts`) fica em memória: vale para um servidor só. Com várias instâncias, troque por um armazenamento compartilhado (ex.: Upstash Redis).
- A busca de jogos fora do catálogo usa a Steam; jogos exclusivos de outras lojas (ex.: exclusivos da Epic) só entram quando houver uma busca pela ITAD.

## Publicação

Arquitetura: **GitHub** (código) → **Vercel** (hospedagem, deploy automático a cada push) + **Turso** (banco) + **GitHub Actions** (atualização de preços de hora em hora).

1. **Banco:** crie um banco no [Turso](https://turso.tech) (SQLite gerenciado, compatível com o libsql daqui), na região mais próxima do Brasil. Gere um token e rode `npm run db:push` com `DATABASE_URL=libsql://...` e `DATABASE_AUTH_TOKEN` apontando para ele.
2. **Hospedagem:** importe o repositório na [Vercel](https://vercel.com/new) e configure as variáveis `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `ITAD_API_KEY`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT`. A `NEXT_PUBLIC_*` entra no código do navegador no build, então mudar uma delas exige um novo deploy. Escolha para as funções a mesma região do banco.
3. **Catálogo inicial:** `npm run seed -- --limit 3000` (≈1h30) a partir da sua máquina, com o `.env` apontando para o banco de produção.
4. **Atualização de preços:** no GitHub, em Settings → Secrets and variables → Actions, crie `SITE_URL` e `CRON_SECRET`. O workflow `.github/workflows/refresh-prices.yml` chama `/api/cron/refresh` de hora em hora (no plano gratuito da Vercel, o cron próprio dela só roda uma vez por dia). Cada execução atualiza as listagens mais desatualizadas primeiro, com limites que cabem no tempo máximo de uma função.

**Fluxo de atualização do site:** cada push na `main` publica em produção em 1–2 minutos, sem tirar o site do ar. Branches e pull requests ganham uma URL de pré-visualização própria, para testar antes de publicar. Se algo der errado, dá para voltar à versão anterior com um clique no painel da Vercel.

**Mudanças no banco:** quando uma funcionalidade alterar o schema (`src/db/schema.ts`), rode `npm run db:push` contra o banco de produção antes de publicar o código que depende da mudança.
