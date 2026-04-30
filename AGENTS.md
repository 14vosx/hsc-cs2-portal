# AGENTS.md — HSC CS2 Portal

## Project context

This repository contains the HSC CS2 Portal.

Main Angular application:

```text
frontend/angular
```

Public staging URL:

```text
/portal/cs2-next/
```

Legacy portal remains production:

```text
/portal/cs2/
```

## Critical deployment boundary

Never treat the public webroot as a Git working tree.

Do not suggest or run:

```text
git pull inside /var/www/portal/cs2
git pull inside /var/www/portal/cs2-next
```

The source repository and the public directory must remain separate.

Correct Angular deploy flow:

```text
frontend/angular
-> build
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

Do not make architecture, API, ETL, Nginx, deploy, or cutover decisions independently.

For those topics, stop and ask the human.

Implementation work is allowed when the task scope is explicit.

## Important docs

Read these when relevant:

```text
docs/angular-migration-status.md
docs/angular-deploy-boundary.md
docs/angular-deploy-plan.md
docs/angular-staging-deploy.md
docs/security-hardening-cs2-webroot.md
```

## Current high-level status

Angular `cs2-next` is already published in staging.

Implemented routes include:

```text
/
/ranking
/matches
/matches/:matchId
/maps
/maps/:map
/api-smoke
```

Do not replace the legacy portal.

Do not perform cutover.

## Git workflow

Work on branches.

Before finalizing changes, show:

```text
git status --short
git diff --stat
```

For code changes, run the relevant build/test command.

Prefer small commits and focused changes.

## General rules

- Keep changes scoped.
- Do not introduce dependencies without approval.
- Do not alter public API contracts unless explicitly requested.
- Do not invent data that the current API does not provide.
- Prefer implementation over strategy discussion; architecture stays outside Codex unless explicitly requested.
