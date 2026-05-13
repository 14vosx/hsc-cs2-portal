# AGENTS.md — HSC CS2 Portal

## Project context

This repository contains the HSC CS2 Portal.

Main Angular application:

```text
frontend/angular
```

Current public canary URL:

```text
/portal/cs2-next/
```

Legacy/current official portal:

```text
/portal/cs2/
```

The canary `/portal/cs2-next/` is published and contains the Angular CS2 Next portal, including the Player Bunker route.

There has been no cutoff from `/portal/cs2-next` to `/portal/cs2`.

## Critical deployment boundary

Never treat the public webroot as a Git working tree.

Do not suggest or run:

```text
git pull inside /var/www/portal/cs2
git pull inside /var/www/portal/cs2-next
git pull inside any /var/www public webroot
```

The source repository and the public directory must remain separate.

Correct Angular deploy flow for canary:

```text
frontend/angular
-> build with base href /portal/cs2-next/
-> dist/hsc-cs2-portal-angular/browser/*
-> /var/www/portal/cs2-next
```

Only publish generated static artifacts from `browser/*`.

Never publish:

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

## Architecture decision policy

Do not make architecture, API, ETL, Nginx, deploy, infrastructure, DNS, auth, billing, or cutover decisions independently.

For those topics, stop and ask the human.

Implementation work is allowed only when the task scope is explicit.

## Current high-level status

Angular `cs2-next` is the active public canary.

Implemented routes include:

```text
/
/ranking
/seasons
/seasons/current
/seasons/current/ranking
/seasons/current/matches
/seasons/current/maps
/seasons/:slug
/seasons/:slug/ranking
/seasons/:slug/matches
/seasons/:slug/maps
/matches
/matches/:matchId
/maps
/maps/:map
/news
/news/:slug
/bunker
/api-smoke
```

Do not replace the legacy portal.

Do not perform cutoff.

Do not change `/portal/cs2` unless the human explicitly starts a cutoff/rollback task.

## Player Bunker boundary

The Player Bunker is a player-facing logged-in area served by the Angular canary route:

```text
/portal/cs2-next/bunker
```

The Portal must use Auth API-backed `/player/*` routes for authenticated Bunker data.

Known player-facing API paths consumed by the Portal:

```text
/player/me
/player/bunker/summary
/player/auth/logout
/player/auth/steam/start
```

Rules:

```text
do not read ETL artifacts directly
do not call the MatchZy DB
do not call the game server
do not store or print player cookies
do not expose session tokens
do not duplicate Admin Auth behavior
do not invent Bunker data if it is absent from the contract
```

The Auth API is the authenticated gateway.

The ETL owns competitive stats materialization.

The Portal owns presentation.

## MVP2 Bunker enrichment rules

The approved next direction is MVP2 — Bunker Melhorado.

Allowed direction:

```text
improve the Bunker UI using existing authenticated /player/* data
consume enriched /player/bunker/summary defensively
distinguish Season data from lifetime/competitive profile data
derive only simple presentation metrics in the frontend
preserve /portal/cs2-next as canary
```

Allowed simple UI derivations include:

```text
K/D from kills/deaths for a recent map item
ADR from damage/rounds for a recent map item
accuracy from shots_on_target_total/shots_fired_total
HS% from head_shot_kills/kills
win/loss labels from isWin
best/worst simple highlights from already-provided arrays
```

Not allowed without explicit approval:

```text
recalculate ranking
recalculate score
recalculate prize eligibility
infer Season membership
create paid/premium gates
add billing
add subdomain bunker
migrate to Angular Material
perform cutoff
add new dependencies
```

## Static API v2 rules

Use existing Static API v2 contracts.

Relevant public endpoints include:

```text
/api/cs2/v2/health.json
/api/cs2/v2/ranking.json
/api/cs2/v2/matches.json
/api/cs2/v2/match/{id}.json
/api/cs2/v2/maps.json
/api/cs2/v2/map/{map}.json
/api/cs2/v2/seasons.json
/api/cs2/v2/season/{slug}.json
/api/cs2/v2/season/{slug}/ranking.json
/api/cs2/v2/season/{slug}/matches.json
/api/cs2/v2/season/{slug}/maps.json
/api/cs2/v2/player/{steamid64}.json
```

Do not alter API contracts.

Do not add N+1 requests from list pages to detail endpoints without approval.

If data is unavailable in the current payload, do not fake it.

## Important docs

Read these when relevant:

```text
docs/angular-migration-status.md
docs/angular-deploy-boundary.md
docs/angular-deploy-plan.md
docs/angular-staging-deploy.md
docs/security-hardening-cs2-webroot.md
```

Project-wide canonical decisions live in `hsc-docs`, especially under:

```text
docs/03-portal-estatico
docs/06-player-bunker
```

If context from `hsc-docs` is needed and not available in this repo, ask the human to provide it.

## Git workflow

Work on branches.

Before finalizing changes, show:

```text
git status --short
git diff --stat
git diff --check
```

For code changes, run the relevant build/test command.

Prefer small commits and focused changes.

## General rules

- Keep changes scoped.
- Do not introduce dependencies without approval.
- Do not alter public API contracts unless explicitly requested.
- Do not invent data that the current API does not provide.
- Preserve canary/legacy separation.
- Prefer implementation over strategy discussion only when scope is explicit.
- Architecture stays outside Codex unless explicitly requested.
