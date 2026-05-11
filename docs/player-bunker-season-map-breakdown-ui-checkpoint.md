# Player Bunker Season Map Breakdown UI Checkpoint

Checkpoint da UI do Bunker entregue no PR #35, presente em `main` no commit `32d2f17`.

## Escopo

O Portal agora renderiza uma lista defensiva de cards por mapa quando:

- `statsAvailable === true`
- `data.seasonPlayer.byMap` existe
- há pelo menos 1 item válido

O limite inicial é de até 6 mapas renderizados.

Campos aceitos para nome do mapa:

- `mapName`
- `mapname`
- `map`

Métricas aceitas por mapa:

- `mapsPlayed` ou `matchesPlayed`
- `wins`
- `losses`
- `winRate`
- `kdRatio`
- `adr`
- `impactRating`

Itens inválidos são ignorados sem quebrar a tela. Campos ausentes são tratados defensivamente e renderizam fallback visual.

## Fronteira de Dados

O Portal consome a Auth API.

A Auth API atua como gateway autenticado para o Bunker. O ETL permanece dono das stats e artifacts competitivos. O Portal não lê o ETL diretamente.

Endpoints envolvidos:

- `GET /player/me`
- `GET /player/bunker/summary`
- `POST /player/auth/logout`
- `/player/auth/steam/start`

## Validação

Comandos usados para validar a entrega:

```bash
cd frontend/angular && npm run build
git diff --check
```

## Limitações

- `recentMaps` e `timeline` ainda não são renderizados.
- Steam real end-to-end no navegador ainda não foi validado nesta etapa.
- Deploy/staging não foi feito nesta PR.
- Artifact real/prod ainda depende de envs/runbook.

## Próxima Frente Sugerida

- Exibir `recentMaps` ou `timeline`.
- Documentar e preparar envs e runbook do Bunker artifact antes de produção.
