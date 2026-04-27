# Portal CS2 — Status da Migração Angular

## Estado atual

A aplicação Angular do Portal CS2 está em:

```text
frontend/angular
```

A migração já possui uma base funcional com páginas reais consumindo a Static API v2.

## Rotas Angular implementadas

```text
/           → Visão Geral
/ranking    → Ranking
/matches    → Partidas
/maps       → Mapas
/api-smoke  → Validação técnica da API
```

## Rotas públicas já validadas

### Visão Geral

Rota:

```text
/
```

Responsabilidades atuais:

- exibir panorama operacional do Portal CS2;
- exibir status da API;
- exibir total de jogadores;
- exibir total de partidas;
- exibir total de mapas;
- exibir líder do ranking;
- exibir última partida;
- exibir mapa mais jogado;
- exibir Top 3 do ranking;
- não exibir JSON bruto.

### Ranking

Rota:

```text
/ranking
```

Responsabilidades atuais:

- consumir `Cs2ApiService.getRanking()`;
- exibir total de jogadores;
- exibir mapas finalizados;
- exibir líder;
- exibir pódio Top 3;
- exibir classificação completa;
- permitir busca por nome;
- permitir busca por SteamID64;
- exibir Score, Impact, V/D, K/D, ADR, HS%, Win% e rounds;
- não exibir JSON bruto.

Observação de contrato:

- `headshotPct` é tratado como percentual já normalizado.
- `winRate` é tratado explicitamente como rate/fração e exibido como percentual.
- Ajuste futuro recomendado: normalizar semântica de percentual/rate na Static API v2.

### Partidas

Rota:

```text
/matches
```

Responsabilidades atuais:

- consumir `Cs2ApiService.getMatches()`;
- exibir total de partidas;
- exibir total de mapas jogados;
- exibir última partida;
- exibir lista de confrontos;
- exibir vencedor;
- exibir placares;
- exibir mapas jogados por confronto;
- permitir busca por matchid, time, vencedor ou mapa;
- permitir filtro por mapa;
- manter detalhe de partida fora de escopo com indicação “Relatório em breve”;
- não exibir JSON bruto.

### Mapas

Rota:

```text
/maps
```

Responsabilidades atuais:

- consumir `Cs2ApiService.getMaps()`;
- exibir total de mapas;
- exibir mapa mais jogado;
- exibir total de partidas;
- exibir total de rounds;
- exibir cards/lista de mapas;
- permitir busca por nome do mapa;
- permitir ordenação por partidas;
- permitir ordenação por rounds;
- permitir ordenação por último jogo;
- manter detalhe de mapa fora de escopo com indicação “Detalhe em breve”;
- não exibir JSON bruto.

### ApiSmoke

Rota:

```text
/api-smoke
```

Responsabilidades atuais:

- validar tecnicamente a Static API v2;
- exibir Health, Ranking, Matches e Maps;
- manter JSON técnico visível;
- apoiar desenvolvimento local e troubleshooting.

## Proxy local

O desenvolvimento local usa:

```text
frontend/angular/proxy.conf.json
```

Regra atual:

```text
/api/cs2  → https://haxixesmokeclub.com
/content  → https://haxixesmokeclub.com
```

Importante:

- não usar proxy genérico em `/api`;
- `/api` capturava indevidamente a rota Angular `/api-smoke`;
- o proxy correto para a Static API v2 é `/api/cs2`.

## Validação realizada

Em `main`, após a integração das páginas Angular:

```bash
cd frontend/angular
npm run build
npm run start:proxy
```

Rotas validadas localmente:

```text
http://localhost:4200/
http://localhost:4200/ranking
http://localhost:4200/matches
http://localhost:4200/maps
http://localhost:4200/api-smoke
```

Resultado:

- build passou;
- servidor local subiu com proxy;
- todas as rotas carregaram;
- dados reais apareceram;
- navegação principal funcionou;
- não houve JSON bruto nas páginas públicas;
- `/api-smoke` preservou JSON técnico;
- acentuação/UTF-8 foi validada;
- não houve mojibake conhecido no marco atual.

## Boundary de deploy

O portal legado ainda é servido diretamente por Nginx a partir de:

```text
/var/www/portal/cs2
```

Regra crítica:

```text
Não fazer git pull cego em /var/www/portal/cs2.
```

Motivo:

- a `main` agora contém `frontend/angular`;
- se o repositório inteiro for atualizado no webroot público, o código-fonte Angular pode ficar exposto em `/portal/cs2/frontend/angular/...`;
- o deploy correto do Angular deve publicar somente o output estático gerado por build.

Referência relacionada:

```text
docs/angular-deploy-boundary.md
```

## Fora de escopo neste marco

Ainda não foi feito:

- deploy do Angular;
- alteração de Nginx;
- substituição do portal legado;
- News Angular;
- Players;
- detalhes de partida;
- detalhes de mapa;
- autenticação;
- backoffice;
- ajuste de ETL;
- alteração de contratos da Static API v2;
- normalização backend de campos percentuais/rates.

## Próximos ciclos possíveis

Ordem recomendada:

1. Documentar estratégia de deploy Angular seguro.
2. Implementar News Angular ou integrar a News já existente.
3. Planejar deploy controlado em subpath separado.
4. Criar pipeline de build/validação para `frontend/angular`.
5. Avaliar normalização de contratos na Static API v2.
6. Só depois planejar substituição gradual do portal legado.

## Decisão atual

A migração Angular está funcional localmente, mas ainda não deve ser publicada na VPS.

O portal legado permanece como produção atual.

O Angular permanece como nova aplicação em desenvolvimento local até existir um plano de deploy seguro.
