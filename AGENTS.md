# AGENTS.md — HSC CS2 Portal

## Escopo

Estas regras se aplicam a todo o repositório `hsc-cs2-portal`.

A aplicação Angular principal está em `frontend/angular/` e é a superfície pública/player-facing de CS2 do HSC.

## Fronteiras

- Não implementar responsabilidades da Auth API, ETL ou Backoffice neste repositório.
- Não alterar contratos de API, autenticação, sessão, cookies ou RBAC sem escopo explícito.
- Não recalcular no frontend regras competitivas pertencentes à Static API v2, como ranking, score, elegibilidade ou pertencimento a Season.
- Não acessar banco MatchZy/SQLite, servidor de jogo ou artefatos internos do ETL diretamente.
- Não fabricar dados quando a fonte estiver indisponível.

Se uma tarefa de UI exigir mudança de contrato backend, interrompa a implementação dessa parte e reporte a dependência.

## Segurança

- Nunca registrar, imprimir ou commitar segredos, cookies, tokens, chaves ou credenciais.
- Não criar arquivos de ambiente com segredos no frontend.
- Requisições autenticadas devem preservar o mecanismo de credenciais já adotado pelo código.
- Não alterar fluxos Steam OpenID, email auth, linking ou sessão sem autorização explícita.

## Implementação

- Siga os padrões Angular 22 já presentes no projeto.
- Prefira mudanças pequenas e feature-local.
- Reutilize contratos, models, normalizers e paths definidos no código; não duplique contratos em Markdown.
- Evite novas dependências, estado global ou grandes migrações visuais sem aprovação.
- Mantenha estados de loading, erro e vazio explícitos em experiências dependentes de dados.
- Preserve a distinção entre dados de Season, perfil competitivo e dados da conta do jogador.

## Área do Jogador

A Área do Jogador e o Bunker são player-facing. Mudanças nessa área não devem introduzir regras administrativas ou assumir semântica de Admin Auth.

Derivações locais devem ser apenas de apresentação sobre dados já fornecidos pelas APIs. Regras de autorização, membership, server access e identidade continuam pertencendo aos serviços responsáveis.

## Operação e deploy

- O diretório de desenvolvimento é `frontend/angular/`.
- Para integração local, prefira `npm run start:proxy`.
- Não trate webroots públicos como working tree Git.
- Não execute deploy, alteração de Nginx ou cutover sem escopo e aprovação explícitos.
- Em publicação, somente artefatos gerados pelo build podem chegar ao webroot; código-fonte, dependências e arquivos de configuração não são artefatos publicáveis.

## Validação

Para alterações de código, execute a validação relevante a partir de `frontend/angular/`:

```bash
npm test
npm run build
git diff --check
```

O projeto não possui script de lint dedicado atualmente. Não invente um gate inexistente.

## Git

- Trabalhe em branch.
- Não altere arquivos fora do escopo.
- Não misture refactors oportunistas com a tarefa atual.
- Antes de finalizar, reporte comandos executados, resultados e eventuais warnings ou falhas.

## Documentação

Documentação local deve permanecer enxuta e dividida entre:

- `README.md`: onboarding humano;
- `docs/setup.md`: operação local;
- `docs/domain.md`: papel funcional;
- `docs/adr/`: decisões arquiteturais imutáveis.

Não documente manualmente rotas, payloads ou schemas de API. Não mantenha changelogs, histórias de PRs, releases datadas ou planos transitórios como documentação permanente.
