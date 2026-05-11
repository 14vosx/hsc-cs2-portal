# Player Bunker Season Summary UI Checkpoint

Checkpoint da UI do Bunker entregue no PR #33, presente em `main` no commit `4d9896a`.

## Escopo

O Portal agora renderiza cards defensivos de métricas competitivas quando:

- `statsAvailable === true`
- `data.seasonPlayer.summary` existe

As métricas iniciais exibidas são:

- `mapsPlayed` ou `matchesPlayed`
- `wins`
- `winRate`
- `kdRatio`
- `adr`
- `impactRating`
- `kills`
- `deaths`
- `assists`

Campos ausentes são tratados defensivamente e renderizam fallback visual, mantendo a tela estável mesmo quando o artifact ainda não traz todos os valores.

## Fronteira de Dados

O Portal consome somente a Auth API. Ele não lê dados do ETL diretamente.

A Auth API atua como gateway autenticado para o Bunker, enquanto o ETL permanece dono das estatísticas e dos artifacts competitivos usados para compor o resumo do jogador.

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

- `byMap`, `recentMaps` e `timeline` ainda não são renderizados.
- Steam real end-to-end no navegador ainda não foi validado nesta etapa.
- Deploy/staging não foi feito nesta PR.
- Artifact real/prod ainda depende de envs/runbook.

## Próxima Frente Sugerida

- Exibir breakdown por mapa do season player ou renderizar `recentMaps`/`timeline`.
- Documentar e deployar envs do Bunker artifact antes de produção.
