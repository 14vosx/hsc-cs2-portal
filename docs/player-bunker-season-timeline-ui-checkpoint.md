# Player Bunker Season Timeline UI Checkpoint

Checkpoint da UI do Bunker entregue no PR #40 e presente em `main` no commit `75b81aa`.

## Escopo

O Portal agora renderiza defensivamente `data.seasonPlayer.timeline` na página do Bunker quando todas as condições abaixo são verdadeiras:

- `statsAvailable === true`
- `data.seasonPlayer.timeline` existe
- há pelo menos 1 item válido após normalização defensiva

A renderização inicial mostra até 8 eventos.

## Campos Aceitos

Cada item de timeline pode usar os seguintes campos opcionais:

- `at`, `timestamp`, `startedAt`, `startTime` ou `start_time`
- `event` ou `type`
- `mapName`, `mapname` ou `map`
- `matchId` ou `matchid`
- `mapNumber` ou `mapnumber`
- `result` ou `outcome`
- `score`
- `kills`
- `deaths`
- `assists`
- `kdRatio`
- `adr`
- `impactRating`

Timestamps são renderizados como string, sem conversão de timezone nesta PR.

Itens inválidos são ignorados sem quebrar a tela. Campos ausentes renderizam fallback visual.

## Fronteira

- Portal consome Auth API.
- Auth API atua como gateway autenticado.
- ETL é dono das stats/artifacts.
- Portal não lê ETL diretamente.

## Endpoints

- `GET /player/me`
- `GET /player/bunker/summary`
- `POST /player/auth/logout`
- `/player/auth/steam/start`

## Validação

Comandos usados para validação:

```bash
cd frontend/angular && npm run build
git diff --check
```

O build passou com warning aceito de budget CSS em `bunker-page.css`.

Warning atual aproximado: `+1.46 kB` acima do budget, total `5.46 kB`.

Solução futura: componentização real do Bunker.

## Limitações

- Steam real end-to-end no navegador ainda não validado nesta etapa.
- Deploy/staging não foi feito nesta PR.
- Artifact real/prod ainda depende de envs/runbook.
- Bunker CSS passou do budget e deve virar cleanup/componentização futura.

## Próxima Frente Sugerida

- Validação visual integrada novamente com timeline.
- Componentização do Bunker.
- Staging controlado do artifact.
- Steam real end-to-end.
