# HSC CS2 Portal

Portal público/player-facing do ecossistema HSC para Counter-Strike 2. A aplicação reúne Home, Ranking, Partidas, Mapas, Seasons, Notícias, perfis públicos, autenticação e Área do Jogador.

O Bunker oferece Player Analytics nos contextos Season atual e Lifetime, organizados em Visão Geral, Clutch + Multi-kill, Mapas e Histórico de Partidas.

A aplicação principal está em `frontend/angular/` e usa Angular 22, TypeScript, ngx-translate e ApexCharts onde visualizações analíticas são necessárias.

## Desenvolvimento local

### Pré-requisitos

- Node.js em versão compatível com Angular 22.
- npm compatível com o `package-lock.json` do projeto.
- Angular CLI global não é obrigatório; o CLI local é instalado por `npm ci`.

### Instalação

```bash
cd frontend/angular
npm ci
```

O frontend não consome `.env.local` atualmente. As integrações de desenvolvimento são resolvidas por paths relativos e pelo proxy do Angular CLI.

Para iniciar somente a aplicação Angular:

```bash
npm start
```

Para desenvolvimento integrado com as APIs configuradas no proxy:

```bash
npm run start:proxy
```

## Validação

```bash
npm run lint
npm test -- --watch=false
npm run build
git diff --check
```

Execute os comandos a partir de `frontend/angular/`, exceto o gate Git quando precisar validar o repositório completo.

## Fronteiras

- O Portal é a camada web de experiência e apresentação.
- A Auth API responde por autenticação e pela autoridade consumida nas superfícies player autenticadas.
- O ETL produz os cálculos e analytics competitivos upstream.
- A Static API v2 fornece dados CS2 às superfícies públicas que já a consomem.
- O Backoffice administra o ecossistema e está fora deste repositório.

O Portal não executa ETL, não acessa seus artefatos internos e não inventa dados ou regras competitivas. O frontend não consome `.env.local` ou variáveis próprias de build atualmente; integrações locais usam paths relativos e o proxy do Angular CLI.

Nunca registre segredos, cookies, tokens ou chaves em arquivos versionados ou documentação.

## Links úteis

- [Setup operacional](docs/setup.md)
- [Guia funcional e domínio](docs/domain.md)
- [Template de ADR](docs/adr/0001-template.md)
- [Regras para agentes de IA](AGENTS.md)
