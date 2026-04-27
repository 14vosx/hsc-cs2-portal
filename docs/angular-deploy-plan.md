# HSC Portal CS2 — Plano de Deploy Seguro do Angular

## Status

Este documento define o plano técnico para publicar futuramente a versão Angular do HSC Portal CS2 de forma segura.

Esta etapa é somente de planejamento e documentação.

Não faz parte desta etapa:

- executar deploy na VPS;
- alterar Nginx;
- alterar `/var/www/portal/cs2`;
- substituir o portal legado;
- criar automação de deploy;
- fazer cutover para Angular;
- executar `git pull` dentro do webroot público.

## Referências

Este plano complementa:

- [`docs/angular-deploy-boundary.md`](./angular-deploy-boundary.md)
- [`docs/angular-migration-status.md`](./angular-migration-status.md)

## Contexto

O repositório do portal é:

```text
C:\workspace\hsc-cs2-portal
https://github.com/14vosx/hsc-cs2-portal
```

A aplicação Angular fica em:

```text
frontend/angular
```

O portal legado ainda roda em produção na VPS via Nginx a partir de:

```text
/var/www/portal/cs2
```

A regra crítica é:

```text
NÃO fazer git pull cego em /var/www/portal/cs2
```

Motivo:

* a branch `main` contém o código-fonte Angular em `frontend/angular`;
* se o repositório inteiro for atualizado dentro do webroot público, arquivos de fonte e configuração podem ficar expostos;
* o deploy correto do Angular deve publicar somente o output estático do build.

## Risco principal

O risco principal é misturar repositório-fonte com diretório público.

O webroot público nunca deve conter:

```text
frontend/angular/src
frontend/angular/node_modules
frontend/angular/package.json
frontend/angular/package-lock.json
frontend/angular/angular.json
frontend/angular/tsconfig*.json
.git
.github
```

A fronteira correta é:

```text
repositório-fonte != diretório público
```

O diretório público deve receber somente artefatos estáticos gerados pelo build Angular.

## Modelo de deploy recomendado

O modelo seguro aprovado é:

```text
build Angular
  -> gerar dist
  -> publicar somente browser/*
  -> servir em staging isolado
  -> validar
  -> somente depois planejar cutover
```

Nesta etapa, o Angular será tratado como staging isolado. O portal legado permanece como produção real.

## Estratégia de build Angular

### Aplicação Angular

Projeto Angular:

```text
hsc-cs2-portal-angular
```

Diretório local:

```text
frontend/angular
```

### Comando de build para staging

Para servir o Angular em `/portal/cs2-next/`, o build deve ser gerado com `baseHref` específico:

```powershell
cd C:\workspace\hsc-cs2-portal\frontend\angular
npx ng build hsc-cs2-portal-angular --base-href=/portal/cs2-next/
```

### `baseHref`

Para staging:

```html
<base href="/portal/cs2-next/">
```

Motivo:

* a aplicação será servida em subpath;
* rotas como `/ranking`, `/matches` e `/maps` precisarão funcionar dentro de `/portal/cs2-next/`;
* assets JS/CSS devem ser resolvidos a partir do path de staging.

### `deployUrl`

Não usar `deployUrl` inicialmente.

Justificativa:

* os assets serão servidos no mesmo subpath da aplicação;
* não há CDN ou host separado para assets nesta fase;
* `baseHref` resolve o requisito atual.

## Pasta de output real

O Angular gera o output em:

```text
frontend/angular/dist/hsc-cs2-portal-angular
```

Porém a pasta publicável correta é:

```text
frontend/angular/dist/hsc-cs2-portal-angular/browser
```

Portanto, o deploy futuro deve publicar somente:

```text
frontend/angular/dist/hsc-cs2-portal-angular/browser/*
```

Não publicar o diretório `dist/hsc-cs2-portal-angular` inteiro sem critério.

## Conteúdo publicável

Arquivos esperados no diretório `browser`:

```text
index.html
favicon.ico
main-*.js
polyfills-*.js
styles-*.css
chunk-*.js
assets estáticos, se existirem
```

A auditoria local validou que a pasta publicável contém somente artefatos estáticos e não contém os itens proibidos.

## Conteúdo proibido no caminho público

Nunca publicar no diretório público:

```text
src
node_modules
package.json
package-lock.json
angular.json
tsconfig.json
tsconfig.app.json
tsconfig.spec.json
.git
.github
```

Esses itens devem continuar apenas no repositório de desenvolvimento.

## Estratégia de publicação segura

A publicação futura deve seguir estas regras:

1. gerar o build local ou em ambiente controlado;
2. validar o conteúdo de `dist/hsc-cs2-portal-angular/browser`;
3. copiar somente o conteúdo de `browser/*`;
4. nunca copiar `frontend/angular`;
5. nunca rodar `git pull` dentro do webroot público;
6. nunca publicar `node_modules`;
7. nunca publicar arquivos de configuração do Angular, Node ou TypeScript;
8. preservar o portal legado.

## Staging aprovado

### URL pública de staging

```text
/portal/cs2-next/
```

### Diretório físico futuro na VPS

```text
/var/www/portal/cs2-next
```

### Relação com o legado

O staging Angular deve ser diretório irmão do legado:

```text
/var/www/portal/
├── cs2/        legado atual, produção
└── cs2-next/   Angular staging futuro
```

Não usar:

```text
/var/www/portal/cs2/frontend/angular
/var/www/portal/cs2/app
```

Motivo:

* evita exposição acidental de fonte;
* evita conflito com o portal legado;
* facilita rollback;
* mantém o staging descartável/recriável.

## Estratégia Nginx

### Objetivo

Servir a SPA Angular em:

```text
/portal/cs2-next/
```

sem interferir em:

```text
/portal/cs2
/api/cs2/...
/content/...
```

### Regra inicial recomendada

A primeira versão deve ser mínima e isolada:

```nginx
location /portal/cs2-next/ {
    alias /var/www/portal/cs2-next/;
    try_files $uri $uri/ /portal/cs2-next/index.html;
}
```

### SPA fallback

O `try_files` é necessário para permitir reload direto em rotas Angular, como:

```text
/portal/cs2-next/ranking
/portal/cs2-next/matches
/portal/cs2-next/maps
/portal/cs2-next/api-smoke
```

Sem fallback para `index.html`, essas rotas podem retornar 404 quando acessadas diretamente.

### Cache

Na primeira implantação de staging, manter cache simples.

Cache avançado fica para etapa posterior, depois de validar:

* layout real do Nginx;
* diretórios existentes;
* comportamento da SPA;
* headers atuais;
* ausência de conflito com o legado.

Estratégia futura desejada:

* `index.html`: no-cache;
* assets versionados `*.js` e `*.css`: cache longo com `immutable`.

Mas isso não deve ser otimizado antes do staging estar funcional.

### Restrições Nginx

Não alterar nesta etapa:

```text
/portal/cs2
/api/cs2
/content
location raiz /
```

Não criar regra genérica que capture o portal legado ou endpoints existentes.

## Estratégia de rollback

Nesta primeira fase, não haverá cutover de produção.

O portal legado continua como produção real:

```text
/portal/cs2
```

O Angular fica isolado em:

```text
/portal/cs2-next
```

Rollback inicial significa:

1. não promover `/portal/cs2-next`;
2. não alterar `/portal/cs2`;
3. não trocar alias ou symlink de produção;
4. remover ou desabilitar somente o staging Angular, se necessário;
5. preservar snapshot da configuração Nginx antes de qualquer alteração real;
6. preservar snapshot do diretório de staging antes de sobrescrever builds futuros.

Para cutover futuro, avaliar separadamente um modelo com releases ou symlink, por exemplo:

```text
/var/www/portal/releases/angular-YYYYMMDDHHMMSS
/var/www/portal/cs2-current -> /var/www/portal/releases/angular-YYYYMMDDHHMMSS
```

Esse modelo não faz parte da primeira implantação.

## Checklist de validação

### Validação local

Antes de qualquer publicação:

```text
build executado com baseHref correto
index.html contém <base href="/portal/cs2-next/">
dist/hsc-cs2-portal-angular/browser existe
browser contém somente artefatos estáticos
browser não contém fonte, node_modules ou configs
rotas locais continuam funcionando via proxy
```

Rotas locais já validadas durante a migração:

```text
http://localhost:4200/
http://localhost:4200/ranking
http://localhost:4200/matches
http://localhost:4200/maps
http://localhost:4200/api-smoke
```

### Validação do artefato publicável

Confirmar que o pacote contém somente:

```text
index.html
favicon.ico
*.js
*.css
assets estáticos, se existirem
```

Confirmar que não contém:

```text
src
node_modules
package.json
package-lock.json
angular.json
tsconfig*.json
.git
.github
```

### Validação em staging

Quando `/portal/cs2-next/` existir, validar:

```text
/portal/cs2-next/
/portal/cs2-next/ranking
/portal/cs2-next/matches
/portal/cs2-next/maps
/portal/cs2-next/api-smoke
```

Critérios:

```text
todas as rotas carregam sem 404
reload direto em /ranking não quebra
reload direto em /matches não quebra
reload direto em /maps não quebra
assets JS/CSS carregam de /portal/cs2-next/
console do navegador sem erro crítico
```

### Validação da API real

Confirmar que a aplicação Angular em staging continua consumindo endpoints existentes:

```text
/api/cs2/...
/content/...
```

Critérios:

```text
Visão Geral carrega dados reais
Ranking carrega dados reais
Partidas carrega dados reais
Mapas carrega dados reais
api-smoke passa
```

### Validação de ausência de fonte exposto

Testar URLs proibidas:

```text
/portal/cs2-next/src/
/portal/cs2-next/node_modules/
/portal/cs2-next/package.json
/portal/cs2-next/package-lock.json
/portal/cs2-next/angular.json
/portal/cs2-next/tsconfig.json
/portal/cs2-next/.git/
/portal/cs2-next/.github/
```

Resultado esperado:

```text
404, 403 ou inexistente
nunca 200
```

### Validação de preservação do legado

Após staging, validar que continuam funcionando:

```text
/portal/cs2
/api/cs2/...
/content/...
```

Critérios:

```text
portal legado intacto
API intacta
conteúdo estático existente intacto
nenhuma regra nova captura paths antigos
```

## Decisões aprovadas

| Tema                    | Decisão                                                             |
| ----------------------- | ------------------------------------------------------------------- |
| URL staging             | `/portal/cs2-next/`                                                 |
| Diretório físico futuro | `/var/www/portal/cs2-next`                                          |
| Diretório legado        | `/var/www/portal/cs2`                                               |
| Build staging           | `npx ng build hsc-cs2-portal-angular --base-href=/portal/cs2-next/` |
| Pasta publicável        | `dist/hsc-cs2-portal-angular/browser/*`                             |
| `baseHref`              | `/portal/cs2-next/`                                                 |
| `deployUrl`             | não usar inicialmente                                               |
| Nginx inicial           | location isolada mínima                                             |
| Cache avançado          | etapa posterior                                                     |
| Rollback inicial        | legado permanece produção                                           |
| Cutover                 | fora do escopo                                                      |

## Fora do escopo desta etapa

Esta etapa não executa:

```text
deploy real na VPS
alteração de Nginx
alteração de /var/www/portal/cs2
substituição do portal legado
automação de deploy
cutover
git pull no webroot público
```

## Próxima etapa operacional futura

Quando este plano estiver aprovado e versionado, a próxima etapa será uma validação somente-leitura na VPS para mapear:

```text
configuração atual do Nginx
server block ativo
root/alias usados pelo portal atual
existência de /var/www/portal
estado de /var/www/portal/cs2
endpoints /api/cs2 e /content
```

Somente depois dessa validação deve ser planejada qualquer alteração real.
