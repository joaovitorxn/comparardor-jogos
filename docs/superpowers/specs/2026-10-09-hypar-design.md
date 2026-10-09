# Hypar — design

## Objetivo
O usuário sinaliza que uma promoção está valendo muito a pena. Isso sobe levemente o jogo na ordem de
relevância e mostra que a comunidade aprovou. Efeito pequeno: só muda a posição com muita gente votando.

## Decisões
- Voto por **jogo** (não por promoção específica); só votos dos **últimos 30 dias** contam.
- Um voto por jogo por navegador (cookie), reforçado no servidor.
- Ícone: **foguete** (novo em `src/components/icon.tsx`). A chama já é a ordenação "Relevância".
- Botão pequeno no card do jogo e na página do jogo; ao passar o mouse mostra discretamente "Hypar".
- Explicação: página curta `/hypar`, linkada no rodapé e no tooltip do botão na página do jogo.

## Dados
Tabela `hypes` (`src/db/schema.ts`): `id`, `gameId`, `voterHash`, `createdAt`; índice único
(`gameId`, `voterHash`) e índice em `createdAt`. `voterHash` = hash de um id aleatório guardado no cookie
(sem IP, sem dado pessoal).

## Voto
- `POST /api/hype` (padrão de `/api/click`): corpo `{ gameId }`; `RateLimiter` por visitante, bloqueio de bots;
  insert com `onConflictDoNothing`; resposta 204.
- Cookie `hypar`: ids já votados + id do votante. O botão lê o cookie no cliente (as páginas são cacheadas por
  ISR, então "já votei" não pode vir do servidor). Após votar: estado ativo e contador +1 só local.
- Limite conhecido: apagar cookies permite votar de novo. O bônus é logarítmico e com teto, então o ganho é mínimo.

## Ranking
- Contagem de hypes dos últimos 30 dias entra em `GameSummary` (via consulta agrupada junto do pool de ofertas
  em `src/db/queries.ts`); atualiza com o cache do pool, sem revalidar nada por voto.
- `featuredScore` ganha `hypeBonus = min(12, 6·log10(1+votos))` (1 voto ≈ +1,8; 10 ≈ +6; 100 = teto 12).
  Valores a calibrar com dados reais.
- O grupo `strong` continua vindo antes; hype só reordena dentro de cada grupo.

## Interface
- Componente `HypeButton` (cliente): ícone foguete, `title`/tooltip "Hypar" no hover, `aria-pressed`, `aria-label`.
  No card usa `stopPropagation`/`preventDefault` para não abrir o link do card.
- Contador visível só a partir de 5 hypes.
- `/hypar`: texto curto explicando o que é, que é um voto por navegador e que o efeito é leve.

## Testes
- Unitário: fórmula do bônus (monotônica, teto, 0 votos = 0) e que `strong` não é ultrapassado por hype.
- Endpoint: voto repetido ignorado, gameId inválido, bot/rate limit.
- Verificação manual no navegador: card, página do jogo, cookie, contador.

## Fora do escopo
Contas de usuário, "desfazer" voto, ordenação própria por hype, notificações.
