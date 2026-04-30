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

Public staging path:

```text
/portal/cs2-next/
```

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

Build must pass without warnings, including CSS budget warnings.

For staging builds, use:

```bash
npx ng build hsc-cs2-portal-angular --base-href=/portal/cs2-next/
```

## API rules

Use existing Static API v2 contracts.

Relevant endpoints:

```text
/api/cs2/v2/health.json
/api/cs2/v2/ranking.json
/api/cs2/v2/matches.json
/api/cs2/v2/maps.json
/api/cs2/v2/match/{id}.json
/api/cs2/v2/map/{map}.json
```

Do not alter API contracts.

Do not add N+1 requests from list pages to detail endpoints without approval.

If data is unavailable in the current payload, do not fake it.

## UX rules

The portal should feel like a CS2 competitive results portal, not a generic dashboard.

Prefer:

- clear hierarchy;
- visible match score;
- visible winner;
- contextual navigation;
- readable tables;
- restrained visual effects;
- subtle interactivity.

Avoid:

- aggressive colors;
- excessive chips;
- too many borders;
- generic GPT-looking cards;
- metadata competing with primary information.

## Current important behavior

`/matches` uses map images from:

```text
public/maps/*.png
```

These are referenced as:

```text
maps/de_mirage.png
```

Do not remove these assets unless explicitly requested.

`/matches` should keep:

- primary map score as the dominant score;
- winner visible;
- CTA to `/matches/:matchId`;
- map links to `/maps/:map`.

## Routing

Do not break these routes:

```text
/
/ranking
/matches
/matches/:matchId
/maps
/maps/:map
/api-smoke
```

## Styling

Keep component CSS within Angular budget.

Do not increase CSS budgets in `angular.json` unless explicitly requested.

Prefer reducing duplication and simplifying selectors.

## Files outside scope

Do not modify deployment docs, Nginx, ETL scripts, or backend/API files from an Angular UI task unless explicitly requested.
