# CS2 Next — Staging Release 2026-05-06

## Status

Release publicada com sucesso em staging público.

URL:

```text
https://haxixesmokeclub.com/portal/cs2-next/
```

Portal legado preservado em produção:

```text
https://haxixesmokeclub.com/portal/cs2/
```

Esta release não executa cutover e não substitui o portal legado.

## Escopo publicado

Esta release consolidou três PRs principais em staging:

```text
#24 feat(cs2-next): add player-facing seasons experience
#25 style(cs2-next): unify portal accent palette
#26 feat(cs2-next): enrich season ranking tables
```

Commits em `main` no momento do build:

```text
f757687 feat(cs2-next): enrich season ranking tables (#26)
7ec8373 style(cs2-next): unify portal accent palette (#25)
86d3fe8 feat(cs2-next): add player-facing seasons experience (#24)
```

## Decisões de produto registradas

* Seasons passa a ser a feature competitiva principal do CS2 Next.
* O ranking oficial player-facing passa a ser o ranking da Season atual.
* `/ranking` permanece como compatibilidade, redirecionando para `/seasons/current/ranking`.
* Ranking geral/all-time fica fora da navegação principal por enquanto.
* O Angular não recalcula regra competitiva; apenas exibe dados vindos da Static API v2.
* Pódio Top 3 usa linguagem de collectable cards.
* Paleta cromática oficial do portal passa a usar roxo, verde/lima e azul/ciano como acentos.
* Tabelas competitivas usam headers reais de coluna e dados limpos em células.
* Nicknames longos são truncados com ellipsis para preservar alinhamento.

## Rotas relevantes

Rotas Angular esperadas após esta release:

```text
/
/seasons
/seasons/current
/seasons/current/ranking
/seasons/:slug
/seasons/:slug/ranking
/ranking
/matches
/matches/:matchId
/maps
/maps/:map
/news
/news/:slug
/api-smoke
```

Observação:

```text
/ranking -> /seasons/current/ranking
```

## Contratos consumidos

A release continua consumindo a Static API v2 existente.

Endpoints relevantes:

```text
/api/cs2/v2/health.json
/api/cs2/v2/ranking.json
/api/cs2/v2/matches.json
/api/cs2/v2/maps.json
/api/cs2/v2/match/{id}.json
/api/cs2/v2/map/{map}.json
/api/cs2/v2/news.json
/api/cs2/v2/news/{slug}.json
/api/cs2/v2/seasons.json
/api/cs2/v2/season/{slug}.json
/api/cs2/v2/season/{slug}/ranking.json
```

Não houve alteração de contrato pela publicação do frontend.

## Features publicadas

### Seasons player-facing

Adicionadas telas públicas de Season:

```text
/seasons
/seasons/current
/seasons/current/ranking
/seasons/:slug
/seasons/:slug/ranking
```

A Season atual exibe:

* hero da temporada;
* tabs de navegação contextual;
* bloco de premiação;
* pódio Top 3;
* métricas da Season;
* preview Top da Season;
* regras resumidas;
* estados “em breve” para partidas e mapas filtrados por Season.

### Ranking da Season

A tabela completa de `/seasons/current/ranking` exibe dados competitivos ricos:

```text
Rank
Jogador
Elegibilidade
Score
V
D
K/D
HS%
ADR
Impact
Mapas
Rounds
```

A tabela mantém:

* busca por jogador;
* avatar/fallback;
* badge de elegibilidade;
* headers reais;
* ellipsis para nicknames longos;
* scroll horizontal quando necessário.

### Paleta visual unificada

A página `/maps/de_mirage` foi usada como referência de identidade cromática.

Sistema de acentos:

```text
roxo/violeta -> links, navegação, estados ativos e destaques secundários
verde/lima   -> badges, status, labels técnicos e metadados
azul/ciano   -> eyebrows, métricas, números e acentos informativos
```

### Tabelas padronizadas

Foram harmonizados:

* Top da Season em `/seasons/current`;
* tabela completa em `/seasons/current/ranking`;
* tabela de partidas em `/maps/:map`;
* ranking legado ainda presente no código, sem reativar navegação.

## Build local

Build executado em `main`:

```bash
cd frontend/angular
npx ng build hsc-cs2-portal-angular --base-href=/portal/cs2-next/
```

Commit do build:

```text
f757687
```

Resultado:

```text
Application bundle generation complete.
```

Arquivos principais gerados:

```text
main-NE6W4XUL.js
styles-YE2ZPLSS.css
polyfills-5CFQRCPP.js
```

O `index.html` foi validado com:

```html
<base href="/portal/cs2-next/">
```

## Warnings conhecidos

O build passou, mas registrou CSS budget warnings:

```text
src/app/features/seasons/season-detail-page/season-detail-page.css
Budget 4.00 kB was not met by 612 bytes with a total of 4.61 kB.

src/app/features/seasons/season-ranking-page/season-ranking-page.css
Budget 4.00 kB was not met by 1.52 kB with a total of 5.52 kB.

src/app/features/overview/overview-page.css
Budget 4.00 kB was not met by 2.56 kB with a total of 6.57 kB.
```

Decisão:

* não bloqueou staging;
* registrar como dívida técnica;
* não aumentar budgets sem decisão explícita;
* atacar depois via redução de duplicação e extração de padrões CSS.

## Artefato local

Pacote local publicado:

```text
/tmp/hsc-cs2-next-20260506-200156-f757687.tar.gz
```

Tamanho:

```text
2.3M
```

SHA256:

```text
ff1bd962c60c5434b8b6cd46fca36600e3dd76b3a681559556dbe83520bf33b6
```

Conteúdo publicado:

```text
browser/*
```

Itens proibidos validados como ausentes:

```text
.git
src
node_modules
angular.json
package.json
package-lock.json
tsconfig*.json
AGENTS.md
```

## Transferência para VPS

Inbox remoto:

```text
/root/hsc-deploy-inbox
```

Pacote remoto:

```text
/root/hsc-deploy-inbox/hsc-cs2-next-20260506-200156-f757687.tar.gz
```

SHA256 remoto validado:

```text
ff1bd962c60c5434b8b6cd46fca36600e3dd76b3a681559556dbe83520bf33b6
```

## Workdir remoto

O pacote foi extraído e auditado em:

```text
/root/hsc-deploy-work/cs2-next-20260506-200156-f757687
```

Validações do workdir:

```text
OK: index.html
OK: logo
OK: hero banner
OK: map-images
OK: sem itens proibidos
OK: workdir não contém maps/
OK: base href /portal/cs2-next/
```

## Backup de rollback

Antes da promoção, foi criado backup do staging anterior:

```text
/root/hsc-deploy-work/backups/cs2-next-before-20260506-200156-f757687.tar.gz
```

SHA256 do backup:

```text
6d9f97b80d7ca5dddf443c97d9a716ca2b6dcbdb67583e37bd7c6a414ae08096
```

## Promoção para staging

Destino publicado:

```text
/var/www/portal/cs2-next
```

Permissões aplicadas:

```text
diretórios: 775
arquivos:   664
owner:      root:www-data
```

Validação Nginx:

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Observação:

* houve apenas warning conhecido de `listen ... http2` deprecated;
* sem erro de sintaxe;
* nenhuma alteração de Nginx foi feita por esta release.

## Assets críticos publicados

Validados no staging:

```text
/var/www/portal/cs2-next/index.html
/var/www/portal/cs2-next/brand/hsc-shield-primary-accent.webp
/var/www/portal/cs2-next/hero-banners/hero_home_ranking_card.webp
/var/www/portal/cs2-next/map-images/*.png
```

Importante:

```text
/var/www/portal/cs2-next/maps/
```

não existe mais como diretório físico, evitando conflito com a rota Angular `/maps`.

## Validação HTTP pública

Rotas validadas com HTTP 200:

```text
https://haxixesmokeclub.com/portal/cs2-next/
https://haxixesmokeclub.com/portal/cs2-next/seasons
https://haxixesmokeclub.com/portal/cs2-next/seasons/current
https://haxixesmokeclub.com/portal/cs2-next/seasons/current/ranking
https://haxixesmokeclub.com/portal/cs2-next/seasons/s01-2026
https://haxixesmokeclub.com/portal/cs2-next/seasons/s01-2026/ranking
https://haxixesmokeclub.com/portal/cs2-next/ranking
https://haxixesmokeclub.com/portal/cs2-next/matches
https://haxixesmokeclub.com/portal/cs2-next/maps
https://haxixesmokeclub.com/portal/cs2-next/maps/de_mirage
https://haxixesmokeclub.com/portal/cs2-next/news
```

Assets validados com HTTP 200:

```text
https://haxixesmokeclub.com/portal/cs2-next/hero-banners/hero_home_ranking_card.webp
https://haxixesmokeclub.com/portal/cs2-next/map-images/de_mirage.png
```

Index público validado com:

```text
<base href="/portal/cs2-next/">
main-NE6W4XUL.js
styles-YE2ZPLSS.css
```

## Validação visual

Validação visual aprovada pelo responsável do projeto.

Páginas inspecionadas:

```text
/portal/cs2-next/
/portal/cs2-next/seasons/current
```

Pontos aprovados:

* Home carregando corretamente;
* Season atual carregando corretamente;
* pódio collectable preservado;
* tabela com headers reais;
* nicknames longos controlados com ellipsis;
* paleta consistente;
* assets carregando;
* staging funcional.

## Fora de escopo

Esta release não fez:

```text
cutover
substituição do portal legado
alteração de Nginx
alteração de backend
alteração de ETL
alteração de contratos da Static API v2
automação de deploy
publicação de código-fonte Angular
git pull no webroot
```

## Pendências conhecidas

* Reduzir CSS duplicado e resolver CSS budget warnings.
* Avaliar avatar Steam real nos endpoints de Season Ranking.
* Evoluir cover image da Season via backoffice.
* Criar páginas ou filtros de partidas por Season.
* Criar páginas ou filtros de mapas por Season.
* Manter staging em observação antes de discutir cutover.
* Documentar plano de cutover apenas quando a decisão for tomada explicitamente.

## Relação com documentos existentes

Este documento complementa:

```text
docs/angular-migration-status.md
docs/angular-deploy-boundary.md
docs/angular-deploy-plan.md
docs/angular-staging-deploy.md
docs/security-hardening-cs2-webroot.md
docs/cs2-next-brand-alignment-plan.md
```

