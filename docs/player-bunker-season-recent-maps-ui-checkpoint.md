# Player Bunker Season Recent Maps UI Checkpoint

Checkpoint da UI do Bunker entregue no PR #37, presente em `main` no commit `800bab7`.

## Escopo

O Portal agora renderiza uma lista defensiva de cards de mapas recentes quando:

- `statsAvailable === true`
- `data.seasonPlayer.recentMaps` existe
- há pelo menos 1 item válido

O limite inicial é de até 5 mapas recentes renderizados.

Campos aceitos por item:

- `mapName`, `mapname` ou `map`
- `startedAt`, `startTime` ou `start_time`
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

## Observação

- O build passou com warning aceito de budget CSS em `bunker-page.css`.

## Limitações

- `timeline` ainda não é renderizado.
- Steam real end-to-end no navegador ainda não foi validado nesta etapa.
- Deploy/staging não foi feito nesta PR.
- Artifact real/prod ainda depende de envs/runbook.
- Bunker CSS passou do budget e pode virar cleanup futuro.

## Próxima Frente Sugerida

- Exibir `timeline`.
- Documentar e preparar envs e runbook do Bunker artifact antes de produção.
- Fazer cleanup/componentização do Bunker.
