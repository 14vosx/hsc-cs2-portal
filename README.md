# HSC CS2 Portal

Portal público/player-facing do ecossistema HSC para Counter-Strike 2.

A aplicação Angular reúne:

- Home;
- Ranking;
- Partidas;
- Mapas;
- Seasons;
- Notícias;
- perfis;
- autenticação;
- Área do Jogador;
- Bunker / Player Analytics;
- HSC Mix / Match Room.

## Stack

```text
Angular 22
TypeScript
RxJS
ngx-translate
ApexCharts onde analytics exige visualização
Vitest
```

Aplicação principal:

```text
frontend/angular/
```

## Autoridade

O Portal é autoridade de:

- experiência;
- composição visual;
- interação;
- motion;
- apresentação.

O Portal não é autoridade de:

- identidade;
- Membership;
- MatchRoom transitions;
- Draft;
- Map Veto;
- ServerAssignment;
- ETL;
- regras competitivas.

## HSC Mix — estado atual

A Formation UX já cobre:

```text
FORMING
CONFIRMING
SETUP
CANCELLED
```

Com:

- listagem de lobbies;
- criação;
- join;
- leave;
- cancel;
- confirmação;
- countdown derivado do backend;
- polling;
- proteção contra stale snapshot/version;
- Player Presentation Reference.

## Próxima fronteira: Portal SETUP

O Auth API já oferece mais domínio do que o frontend consome.

O próximo bloco deve apresentar:

- captains;
- Captain Draft;
- current picker;
- deadline;
- Team A/B;
- Map Veto;
- map pool;
- bans;
- selected map;
- CompetitiveMatch;
- READY;
- PROVISIONING.

O frontend deve seguir `viewer.actions` para habilitar CTAs.

## Player Presentation Reference

Dados garantidos hoje:

```text
steamId64
Steam personaname
Steam avatarMediumUrl
profile.slug | null
```

Não assumir no Match Room:

- preferred role;
- rank;
- HSC number;
- ping;
- online status;
- network quality.

## Motion como requisito

A Match Room deve parecer viva, mas motion só pode representar mudança real confirmada pelo backend.

Exemplos:

### Map ban

```text
AVAILABLE
→ pending
→ snapshot confirma ban
→ escurecimento/desaturação
→ BANNED
→ foco passa ao próximo vetoer
```

### Draft pick

```text
available
→ pending
→ snapshot confirma assignment
→ card sai do pool
→ entra no roster
→ foco troca
```

Regras:

- não decidir estado no frontend;
- não animar estado terminal antes da confirmação autoritativa;
- respeitar snapshot version;
- respeitar `prefers-reduced-motion`;
- não adicionar framework de animação sem necessidade.

## READY / PROVISIONING

O Portal pode apresentar:

```text
READY
PROVISIONING
```

Mas ainda não deve exibir CTA de join.

`JOINABLE` ainda não existe no backend.

## Desenvolvimento

```bash
cd frontend/angular
npm ci
npm run start:proxy
```

## Validação

```bash
npm run lint
npm test -- --watch=false
npm run build
git diff --check
```

## Known issue

Há warnings de style budget já registrados em issue. Não misturar essa dívida com P3 salvo se houver regressão causada pela nova Match Room.

## Segurança

- não armazenar secrets no frontend;
- cookies/tokens não vão para log;
- nenhum dado competitivo é inventado no browser;
- deep links de join só quando backend autorizar.