# Player Bunker Auth Shell Checkpoint

Checkpoint da primeira shell autenticada do Bunker após o PR #30.

## Escopo entregue

- Rota player-facing: `/bunker`
- Link `Bunker` no header principal do Portal CS2 Next
- Shell visual com estados básicos de autenticação, sem estatísticas reais

## Endpoints usados

- `GET /player/me`
- `GET /player/bunker/summary`
- `POST /player/auth/logout`
- `/player/auth/steam/start`

## Proxy local

O ambiente local do Angular encaminha chamadas player-facing para a Auth API local:

```text
/player -> http://127.0.0.1:3010
```

## Estados da UI

- `loading`
- `unauthenticated`
- `authenticated`
- `error`

## Contrato do summary

O Bunker summary aceita o contrato envelopado da Auth API:

```json
{
  "ok": true,
  "data": {
    "player": {},
    "bunker": {
      "status": "string",
      "seasonFirst": true,
      "statsAvailable": false
    }
  }
}
```

A UI normaliza `data.bunker` e mantém fallback para os campos na raiz:

- `status`
- `seasonFirst`
- `statsAvailable`

## Validação feita

- `npm run build`
- Teste manual em `localhost:4200/bunker` sem sessão:
  - `/player/me` respondeu `401` JSON pela Auth API
  - a tela mostrou o botão `Entrar com Steam`

## Limitações

- Sem stats reais
- Sem Steam real validado no Portal
- Sem deploy/staging
- Sem UI final do Bunker

## Próxima frente

```text
feat(player-bunker): connect authenticated summary to real player stats contract
```
