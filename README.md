# HSC CS2 Portal

Portal público/player-facing do ecossistema HSC para jogadores de Counter-Strike 2. A aplicação Angular apresenta rankings, partidas, mapas, Seasons, notícias, perfis públicos e a Área do Jogador, incluindo o Bunker e fluxos de autenticação da conta.

Este repositório contém a experiência web do jogador. Ele **não** é a `hsc-auth-api`, não é o `hsc-cs2-etl` e não é o Backoffice administrativo.

## Desenvolvimento local

### Pré-requisitos

- Node.js 22 ou versão compatível com Angular 22.
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

Também é possível usar diretamente o CLI local:

```bash
npx ng serve
```

Consulte [`docs/setup.md`](docs/setup.md) para configuração e validação detalhadas.

## Variáveis de ambiente

| NOME_DA_VAR | DESCRIÇÃO |
| --- | --- |
| — | O frontend não consome variáveis de ambiente de build atualmente; as origens usadas em desenvolvimento são definidas pelos paths da aplicação e pelo proxy local. |

Nunca registre segredos, cookies, tokens ou chaves em arquivos versionados ou documentação.

## Links úteis

- [Setup operacional](docs/setup.md)
- [Guia funcional e domínio](docs/domain.md)
- [Template de ADR](docs/adr/0001-template.md)
- [Regras para agentes de IA](AGENTS.md)
