# hsc-cs2-portal

Portal publico CS2 do HSC, incluindo Angular CS2 Next, ranking, partidas, mapas, Seasons, noticias e consumo da Static API v2.

## Papel no ecossistema HSC

Este repositorio contem a superficie player-facing do CS2 no HSC.

O portal consome JSONs estaticos da Static API v2 gerada pelo `hsc-cs2-etl` e, quando aplicavel, conteudo publico usado pela experiencia do jogador.

Este repositorio nao e:

- o ETL;
- a Auth API;
- o Backoffice.

## Status atual

- O Angular CS2 Next esta publicado em staging publico em `/portal/cs2-next/`.
- Staging publico: https://haxixesmokeclub.com/portal/cs2-next/
- O portal legado `/portal/cs2/` permanece preservado.
- Portal legado: https://haxixesmokeclub.com/portal/cs2/
- Nao houve cutover.
- Rotas player-facing de Seasons ja existem para overview, ranking, partidas e mapas.

## Estrutura principal

- `AGENTS.md`: regras operacionais para agentes neste repositorio.
- `docs/`: documentacao local sobre migracao Angular, deploy, staging e seguranca.
- `frontend/angular/`: aplicacao Angular principal.
- `frontend/angular/src/`: codigo-fonte da aplicacao Angular.
- `frontend/angular/public/`: assets publicos servidos pela aplicacao Angular.
- `frontend/angular/proxy.conf.json`: proxy local para desenvolvimento com API real.
- `frontend/angular/package.json`: scripts e dependencias da aplicacao Angular.

## Rotas principais

No staging publico, estas rotas vivem sob `/portal/cs2-next/`.

- `/`
- `/ranking`: redireciona para `/seasons/current/ranking`
- `/seasons`
- `/seasons/current`
- `/seasons/current/ranking`
- `/seasons/current/matches`
- `/seasons/current/maps`
- `/seasons/:slug`
- `/seasons/:slug/ranking`
- `/seasons/:slug/matches`
- `/seasons/:slug/maps`
- `/matches`
- `/matches/:matchId`
- `/maps`
- `/maps/:map`
- `/news`
- `/news/:slug`
- `/api-smoke`

## Desenvolvimento local

```bash
cd frontend/angular
npm install
npm run start:proxy
```

Use `npm run start:proxy` para validar dados reais da API.

`npm start` ou `ng serve` podem servir para UI local sem validacao real de API, mas nao sao os comandos preferenciais para integracao.

## Build

```bash
cd frontend/angular
npm run build
```

Build de staging:

```bash
npx ng build hsc-cs2-portal-angular --base-href=/portal/cs2-next/
```

O build deve passar sem warnings. CSS budget warnings devem ser tratados, nao ignorados.

Output esperado:

```text
frontend/angular/dist/hsc-cs2-portal-angular/browser
```

## Deploy boundary

Nunca trate `/var/www/portal/cs2` ou `/var/www/portal/cs2-next` como Git working tree.

Nunca rode `git pull` dentro desses webroots.

Publique somente os artefatos gerados em `browser/*`.

Nunca publique:

```text
frontend/angular/src
node_modules
package.json
package-lock.json
angular.json
tsconfig*.json
.git
.github
.env
.npmrc
```

O deploy real deve seguir runbook/documentacao, com snapshot, staging temporario, dry-run e autorizacao explicita.

## API / contratos

O portal usa a Static API v2 sob `/api/cs2/v2/`.

Os contratos sao definidos pelo `hsc-cs2-etl` e documentados em `hsc-docs`.

Regras importantes:

- o frontend nao deve recalcular regra de pertencimento de Season;
- o frontend nao deve criar dados fake;
- evitar N+1 requests de listagens para detalhes sem decisao explicita.

Endpoints principais:

- `/api/cs2/v2/health.json`
- `/api/cs2/v2/ranking.json`
- `/api/cs2/v2/matches.json`
- `/api/cs2/v2/maps.json`
- `/api/cs2/v2/seasons.json`
- `/api/cs2/v2/season/{slug}.json`
- `/api/cs2/v2/season/{slug}/ranking.json`
- `/api/cs2/v2/season/{slug}/matches.json`
- `/api/cs2/v2/season/{slug}/maps.json`
- `/api/cs2/v2/match/{id}.json`
- `/api/cs2/v2/map/{map}.json`

## Seguranca

- Nao commitar segredos.
- Nao publicar arquivos fonte no webroot.
- Nao versionar outputs de build.
- Nao expor `.env`.
- Respeitar `AGENTS.md`.

## Documentacao relacionada

Docs locais:

- `docs/angular-migration-status.md`
- `docs/angular-deploy-boundary.md`
- `docs/angular-deploy-plan.md`
- `docs/angular-staging-deploy.md`
- `docs/security-hardening-cs2-webroot.md`
- `docs/cs2-next-staging-release-20260506.md`
- `docs/cs2-next-brand-alignment-plan.md`

Docs canonicas em `hsc-docs`:

- `docs/00-governance/hsc-repositories-map.md`
- `docs/03-portal-estatico/portal-estatico-frontend-structure.md`
- `docs/03-portal-estatico/static-api-v2.md`
- `docs/03-portal-estatico/nginx-publishing-cache.md`
- `docs/03-portal-estatico/portal-estatico-operational-runbooks.md`

## Workflow

- Trabalhar em branch.
- Manter PRs pequenos.
- Antes de finalizar:

```bash
git diff --check
git diff --stat
cd frontend/angular && npm run build
```

- Nao alterar ETL, Auth API ou Backoffice a partir deste repositorio.
