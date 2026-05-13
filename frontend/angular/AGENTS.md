# AGENTS.md — Angular frontend

## Scope

These instructions apply to:

```text
frontend/angular/**
```

## Application

Angular app for HSC CS2 Portal.

Local app directory:

```text
frontend/angular
```

Public canary path:

```text
/portal/cs2-next/
```

Legacy/current official portal path:

```text
/portal/cs2/
```

There has been no cutoff. Do not treat `/portal/cs2-next` as official production replacement unless the human explicitly starts a cutoff task.

## Local development

Use proxy when validating real API data:

```bash
npm run start:proxy
```

Do not use `npm start` for API validation unless explicitly requested.

## Build

Before finalizing Angular changes, run:

```bash
npm run build
```

For canary builds, use:

```bash
npx ng build hsc-cs2-portal-angular --base-href=/portal/cs2-next/
```

Build warnings should normally be treated as problems.

Known temporary exception:

```text
src/app/features/bunker/bunker-page.css currently exceeds the component CSS budget.
```

This exception is accepted only as a temporary MVP/Canary condition. Do not grow this warning casually. If work touches Bunker CSS, prefer reducing or containing CSS size. New warnings outside this known Bunker budget issue should be treated as failures unless the human explicitly accepts them.

## API rules

Use existing Static API v2 contracts and Auth API-backed `/player/*` contracts.

Static API v2 endpoints include:

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

Authenticated player/Bunker paths include:

```text
/player/me
/player/bunker/summary
/player/auth/logout
/player/auth/steam/start
```

Rules:

```text
use withCredentials for authenticated /player/* requests when needed
do not print cookies or session values
do not read ETL artifacts directly
do not call MatchZy DB
do not call the game server
do not fake unavailable data
do not recalculate ranking/score/elegibility
do not infer Season membership in the frontend
```

If a UI task requires a backend/API contract change, stop and ask the human.

## Routing

Do not break these routes:

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

## Player Bunker rules

The Bunker route is:

```text
/bunker
```

In public canary it is served at:

```text
/portal/cs2-next/bunker
```

The Bunker must keep these conceptual sections distinct:

```text
authenticated player identity
current Season overview
Season-scoped player stats
lifetime/competitive profile stats when provided
recent maps
timeline
logout/session state
```

For MVP2 — Bunker Melhorado:

Allowed frontend derivations are presentation-only and must use already available fields, for example:

```text
recent-map K/D = kills / deaths
recent-map ADR = damage / rounds
recent-map accuracy = shots_on_target_total / shots_fired_total
recent-map HS% = head_shot_kills / kills
win/loss label from isWin
simple best/worst highlights from provided arrays
```

Not allowed without explicit approval:

```text
ranking recalculation
score recalculation
prize eligibility
Season membership calculation
premium/billing gate
new chart dependency
large visual rewrite
Angular Material migration
```

## UX rules

The portal should feel like a CS2 competitive results portal, not a generic dashboard.

Prefer:

```text
clear hierarchy
visible match score
visible winner
contextual navigation
readable tables
subtle interactivity
strong player/season distinction
defensive empty/loading/error states
```

Avoid:

```text
excessive chips
too many borders
generic GPT-looking cards
metadata competing with primary information
unclear distinction between Season and lifetime data
heavy chart libraries without approval
```

## Current important behavior

`/matches` uses map images from:

```text
public/map-images/*.png
```

These are referenced as:

```text
map-images/de_mirage.png
```

Do not remove these assets unless explicitly requested.

`/matches` should keep:

```text
primary map score as the dominant score
winner visible
CTA to /matches/:matchId
map links to /maps/:map
```

## Styling

Prefer reducing duplication and simplifying selectors.

For Bunker work:

```text
watch bunker-page.css size
avoid broad CSS rewrites
prefer small helpers/classes
avoid adding dependencies only for visual polish
consider componentization only when it reduces complexity
```

## Files outside scope

Do not modify deployment docs, Nginx, ETL scripts, backend/API files, or public webroots from an Angular UI task unless explicitly requested.

Do not modify:

```text
/var/www/portal/cs2
/var/www/portal/cs2-next
```

from this repository task.

## Validation

For UI/code changes, run:

```bash
npm run build
```

Also run:

```bash
git diff --check
git diff --stat
```

For Bunker work, additionally verify that the affected route still uses relative `/player/*` paths and does not introduce direct artifact access.
