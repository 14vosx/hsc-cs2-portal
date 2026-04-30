# HSC Portal CS2 - Deploy de Staging Angular

## Status

Este documento registra o deploy controlado da versao Angular do HSC Portal CS2 em ambiente de staging publico.

O staging foi publicado sem cutover e sem substituir o portal legado.

## Resultado

Staging Angular publicado em:

```text
https://haxixesmokeclub.com/portal/cs2-next/
```

Portal legado preservado em:

```text
https://haxixesmokeclub.com/portal/cs2/
```

Nao houve:

```text
cutover
substituicao do portal legado
git pull no webroot
publicacao de codigo-fonte Angular
alteracao de API
alteracao de ETL
automacao de deploy
```

## Referencias

Este deploy segue as decisoes registradas em:

```text
docs/angular-deploy-plan.md
docs/angular-deploy-boundary.md
docs/angular-migration-status.md
docs/security-hardening-cs2-webroot.md
```

## Contexto

A aplicacao Angular fica no repositorio em:

```text
frontend/angular
```

O build Angular foi preparado para ser servido em subpath:

```text
/portal/cs2-next/
```

O diretorio fisico de staging na VPS e:

```text
/var/www/portal/cs2-next
```

O portal legado permanece em:

```text
/var/www/portal/cs2
```

## Build local

O build foi gerado localmente com:

```powershell
cd C:\workspace\hsc-cs2-portal\frontend\angular
npx ng build hsc-cs2-portal-angular --base-href=/portal/cs2-next/
```

O output Angular foi gerado em:

```text
frontend/angular/dist/hsc-cs2-portal-angular
```

A pasta publicavel correta foi:

```text
frontend/angular/dist/hsc-cs2-portal-angular/browser
```

## baseHref

O `index.html` gerado foi validado com:

```html
<base href="/portal/cs2-next/">
```

Essa configuracao e obrigatoria porque o Angular esta sendo servido em subpath.

## Conteudo publicavel

Arquivos publicados:

```text
index.html
favicon.ico
main-JN3B6QGT.js
polyfills-5CFQRCPP.js
styles-CQRBV6V6.css
chunk-EWAU4RMQ.js
chunk-LUOVRAWU.js
chunk-PV4XCHCM.js
chunk-PWVGRNS6.js
chunk-QCQ4CL3E.js
chunk-UCRZ7RX4.js
chunk-UXPYWVFD.js
chunk-W5XG4JCY.js
```

## Conteudo proibido

O artefato foi validado para nao conter:

```text
.git
.github
.gitignore
.env
.npmrc
src
node_modules
package.json
package-lock.json
angular.json
tsconfig.json
tsconfig.app.json
tsconfig.spec.json
```

## Pacote de deploy

Foi criado um pacote local contendo somente o conteudo de `browser/*`:

```text
C:\Users\caioh\AppData\Local\Temp\hsc-cs2-next-angular-20260427-191606.tar.gz
```

Tamanho local:

```text
111147 bytes
```

SHA256 local:

```text
3AD1B0B0E13B942628B33CC0D3EEDB19C00AACAB2A51C0BF42600D980030DC98
```

## Transferencia para VPS

Antes da publicacao, foi criado um inbox restrito na VPS:

```text
/root/hsc-deploy-inbox
```

Permissoes:

```text
drwx------ root root
```

O pacote foi transferido para:

```text
/root/hsc-deploy-inbox/hsc-cs2-next-angular-20260427-191606.tar.gz
```

Na VPS, o SHA256 foi validado novamente:

```text
3AD1B0B0E13B942628B33CC0D3EEDB19C00AACAB2A51C0BF42600D980030DC98
```

Resultado:

```text
SHA_OK
OK_NO_FORBIDDEN_IN_PACKAGE
```

## Publicacao fisica

O pacote foi extraido primeiro em diretorio temporario restrito sob `/root`.

Antes de publicar, foram validados:

```text
index.html com baseHref correto
ausencia de conteudo proibido
conteudo esperado do build Angular
```

Depois disso, foi criado o diretorio de staging:

```text
/var/www/portal/cs2-next
```

Permissoes finais:

```text
drwxrwxr-x root www-data /var/www/portal/cs2-next
```

Arquivos finais:

```text
-rw-rw-r-- root www-data index.html
-rw-rw-r-- root www-data favicon.ico
-rw-rw-r-- root www-data main-JN3B6QGT.js
-rw-rw-r-- root www-data polyfills-5CFQRCPP.js
-rw-rw-r-- root www-data styles-CQRBV6V6.css
-rw-rw-r-- root www-data chunk-*.js
```

## Estado antes da exposicao no Nginx

Antes de alterar o Nginx, o diretorio fisico existia, mas ainda nao estava exposto.

Resultado HTTP esperado e observado:

```text
404 /portal/cs2-next/
404 /portal/cs2-next/ranking
404 /portal/cs2-next/.git/HEAD
200 /portal/cs2/
200 /api/cs2/v2/health.json
200 /content/news/
```

Isso confirmou que a criacao fisica do diretorio nao alterou o comportamento publico antes da configuracao Nginx.

## Configuracao Nginx

Arquivo ativo alterado:

```text
/etc/nginx/conf.d/srv1353392.hstgr.cloud.conf
```

Antes da alteracao, foi criado snapshot restrito em:

```text
/root/hsc-security-snapshots/srv1353392.hstgr.cloud.conf.pre-cs2-next-staging-20260427T222240Z
```

Regra adicionada para bloquear dotfiles diretos no staging:

```nginx
# HSC SECURITY - deny direct hidden files under /portal/cs2-next
# Prevents .git, .env, .gitignore and similar paths from falling through to the SPA fallback.
location ^~ /portal/cs2-next/. {
    return 404;
}
```

Regra adicionada para servir a SPA Angular:

```nginx
# HSC Portal CS2 Angular staging
location /portal/cs2-next/ {
    alias /var/www/portal/cs2-next/;
    try_files $uri $uri/ /portal/cs2-next/index.html;
}
```

A regra foi inserida antes da secao do portal legado:

```text
# Portal CS2 (SPA)
```

## Validacao Nginx

Antes do reload foi executado:

```bash
nginx -t
```

Resultado:

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Depois disso foi executado:

```bash
systemctl reload nginx
```

Status final:

```text
active
```

Observacao: o Nginx mostrou warnings existentes sobre `listen ... http2` depreciado. Esses warnings nao bloquearam o deploy de staging.

## Validacao HTTP interna

A partir da VPS, usando resolucao local para `127.0.0.1`, foram validadas as rotas:

```text
200 /portal/cs2-next/
200 /portal/cs2-next/ranking
200 /portal/cs2-next/ranking/
200 /portal/cs2-next/matches
200 /portal/cs2-next/maps
200 /portal/cs2-next/api-smoke
200 /portal/cs2-next/index.html
200 /portal/cs2-next/favicon.ico
200 /portal/cs2-next/main-JN3B6QGT.js
200 /portal/cs2-next/polyfills-5CFQRCPP.js
200 /portal/cs2-next/styles-CQRBV6V6.css
200 /portal/cs2-next/chunk-QCQ4CL3E.js
```

Hardening do staging:

```text
404 /portal/cs2-next/.git/HEAD
404 /portal/cs2-next/.git/config
404 /portal/cs2-next/.gitignore
404 /portal/cs2-next/.env
```

Legado e APIs preservados:

```text
200 /portal/cs2/
200 /portal/cs2/ranking/
200 /portal/cs2/matches/
200 /portal/cs2/maps/
200 /api/cs2/v2/health.json
200 /api/cs2/v2/ranking.json
200 /api/cs2/v2/matches.json
200 /api/cs2/v2/maps.json
200 /content/news/
```

## Content-Types validados

Foram validados content-types coerentes:

```text
text/html                 /portal/cs2-next/
application/javascript    /portal/cs2-next/main-JN3B6QGT.js
text/css                  /portal/cs2-next/styles-CQRBV6V6.css
application/json          /api/cs2/v2/health.json
```

## Validacao HTTP externa

A partir da maquina local, via DNS publico real, foram validados:

```text
200 /portal/cs2-next/
200 /portal/cs2-next/ranking
200 /portal/cs2-next/matches
200 /portal/cs2-next/maps
200 /portal/cs2-next/api-smoke
200 /portal/cs2-next/index.html
200 /portal/cs2-next/main-JN3B6QGT.js
200 /portal/cs2-next/styles-CQRBV6V6.css
404 /portal/cs2-next/.git/HEAD
404 /portal/cs2-next/.env
200 /portal/cs2/
200 /api/cs2/v2/health.json
200 /content/news/
```

## Validacao visual

Validacao manual no navegador aprovada em:

```text
https://haxixesmokeclub.com/portal/cs2-next/
https://haxixesmokeclub.com/portal/cs2-next/ranking
https://haxixesmokeclub.com/portal/cs2-next/matches
https://haxixesmokeclub.com/portal/cs2-next/maps
https://haxixesmokeclub.com/portal/cs2-next/api-smoke
```

Checklist visual aprovado:

```text
Visao Geral carrega com dados reais
Ranking carrega com dados reais
Partidas carrega com dados reais
Mapas carrega com dados reais
api-smoke passa
console do navegador sem erro critico
assets carregam corretamente
```

## Captura final da VPS

Estado final do Nginx:

```text
nginx -t successful
nginx active
```

Estado final do staging:

```text
/var/www/portal/cs2-next
root:www-data
drwxrwxr-x
```

`baseHref` final:

```html
<base href="/portal/cs2-next/">
```

Validacao final:

```text
200 /portal/cs2-next/
200 /portal/cs2-next/ranking
200 /portal/cs2-next/matches
200 /portal/cs2-next/maps
200 /portal/cs2-next/api-smoke
404 /portal/cs2-next/.git/HEAD
404 /portal/cs2-next/.env
200 /portal/cs2/
200 /api/cs2/v2/health.json
200 /content/news/
```

## Artefatos preservados na VPS

Pacote de staging preservado em:

```text
/root/hsc-deploy-inbox/hsc-cs2-next-angular-20260427-191606.tar.gz
```

Snapshot Nginx preservado em:

```text
/root/hsc-security-snapshots/srv1353392.hstgr.cloud.conf.pre-cs2-next-staging-20260427T222240Z
```

Snapshots anteriores de hardening tambem permanecem preservados em:

```text
/root/hsc-security-snapshots
```

## Rollback do staging

Como nao houve cutover, o rollback e simples.

Para desabilitar o staging Angular em uma etapa futura:

```text
remover ou comentar a location /portal/cs2-next/
remover ou comentar a location ^~ /portal/cs2-next/.
validar nginx -t
recarregar nginx
```

O diretorio fisico pode ser mantido ou removido posteriormente:

```text
/var/www/portal/cs2-next
```

O legado nao depende desse diretorio.

## Estado final

Estado final aprovado:

```text
Angular staging publicado com sucesso
/portal/cs2-next/ funcional
/portal/cs2 legado preservado
/api/cs2/v2 preservado
/content/news preservado
dotfiles bloqueados
sem cutover
sem substituicao da producao
sem git pull no webroot
```

## Fora do escopo deste deploy

Este deploy nao executou:

```text
promocao do Angular para /portal/cs2
remocao do portal legado
alteracao de API
alteracao de ETL
automacao de deploy
troca de symlink de producao
cache avancado para assets
```

## Proximas etapas recomendadas

Antes de qualquer cutover:

```text
validar o staging por mais tempo
testar em dispositivos diferentes
validar cache e headers
definir estrategia de promocao
definir rollback de cutover
documentar plano de cutover separadamente
```

---

## Refresh de staging — PR #15 — UX de partidas

Data: 2026-04-30

Este refresh publicou em staging o resultado do PR:

```text
#15 feat(cs2-next): polish matches page UX
```

Commit em `main`:

```text
acf0f3d feat(cs2-next): polish matches page UX (#15)
```

### Resultado

Staging atualizado em:

```text
https://haxixesmokeclub.com/portal/cs2-next/
```

Rota principal validada:

```text
https://haxixesmokeclub.com/portal/cs2-next/matches
```

### Build local

O build foi gerado com `baseHref` de staging:

```powershell
cd C:\workspace\hsc-cs2-portal\frontend\angular
npx ng build hsc-cs2-portal-angular --base-href=/portal/cs2-next/
```

O `index.html` gerado foi validado com:

```html
<base href="/portal/cs2-next/">
```

### Conteúdo novo publicado

Além dos arquivos Angular versionados, este refresh passou a publicar assets estáticos de mapas:

```text
maps/de_ancient.png
maps/de_anubis.png
maps/de_dust2.png
maps/de_inferno.png
maps/de_mirage.png
maps/de_nuke.png
maps/de_overpass.png
maps/de_train.png
```

Asset principal do build:

```text
main-LFXA2KEE.js
```

### Pacote de deploy

Pacote local criado:

```text
C:\Users\caioh\AppData\Local\Temp\hsc-cs2-next-angular-20260430-101503.tar.gz
```

Tamanho local:

```text
2199899 bytes
```

SHA256 local/remoto:

```text
3F246DB68C293C815A9DB8DD25AC95E0A6C73B391717965874FED391A33F7154
```

Pacote preservado na VPS:

```text
/root/hsc-deploy-inbox/hsc-cs2-next-angular-20260430-101503.tar.gz
```

### Workdir remoto

O pacote foi extraído e auditado antes da publicação em:

```text
/root/hsc-deploy-work/cs2-next-20260430-101503
```

Validações realizadas no workdir:

```text
baseHref correto
maps/*.png presentes
OK_NO_FORBIDDEN_CONTENT
permissões normalizadas
```

### Snapshot de rollback

Antes de sobrescrever o staging, foi criado snapshot do estado anterior:

```text
/root/hsc-security-snapshots/cs2-next-pre-refresh-20260430-101503.tar.gz
```

### Publicação física

Publicação executada com:

```text
rsync -a --delete --chown=root:www-data --chmod=D775,F664
```

Destino:

```text
/var/www/portal/cs2-next
```

Permissões finais validadas:

```text
drwxrwxr-x root www-data /var/www/portal/cs2-next
-rw-rw-r-- root www-data /var/www/portal/cs2-next/index.html
-rw-rw-r-- root www-data /var/www/portal/cs2-next/main-LFXA2KEE.js
-rw-rw-r-- root www-data /var/www/portal/cs2-next/maps/de_mirage.png
```

### Validação HTTP interna

Validação na VPS aprovada:

```text
200 text/html /portal/cs2-next/
200 text/html /portal/cs2-next/matches
200 text/html /portal/cs2-next/matches/3
200 text/html /portal/cs2-next/maps/de_mirage
200 text/html /portal/cs2-next/index.html
200 application/javascript /portal/cs2-next/main-LFXA2KEE.js
200 text/css /portal/cs2-next/styles-CQRBV6V6.css
200 image/png /portal/cs2-next/maps/de_mirage.png
200 image/png /portal/cs2-next/maps/de_dust2.png
404 text/html /portal/cs2-next/.git/HEAD
404 text/html /portal/cs2-next/.env
200 text/html /portal/cs2/
200 application/json /api/cs2/v2/health.json
200 application/json /content/news/
```

### Validação HTTP externa

Validação pela máquina local aprovada:

```text
200 text/html /portal/cs2-next/
200 text/html /portal/cs2-next/matches
200 text/html /portal/cs2-next/matches/3
200 text/html /portal/cs2-next/maps/de_mirage
200 text/html /portal/cs2-next/index.html
200 application/javascript /portal/cs2-next/main-LFXA2KEE.js
200 text/css /portal/cs2-next/styles-CQRBV6V6.css
200 image/png /portal/cs2-next/maps/de_mirage.png
200 image/png /portal/cs2-next/maps/de_dust2.png
404 text/html /portal/cs2-next/.git/HEAD
404 text/html /portal/cs2-next/.env
200 text/html /portal/cs2/
200 application/json /api/cs2/v2/health.json
200 application/json /content/news/
```

### Validação visual

Resultado final:

```text
Visual staging aprovado
Console sem erro crítico
API OK
```

### Garantias preservadas

Este refresh não executou:

```text
cutover
alteração de Nginx
alteração de API
alteração de ETL
git pull no webroot
publicação de código-fonte Angular
substituição do portal legado
```

O portal legado permaneceu preservado em:

```text
/portal/cs2/
```

A Static API v2 permaneceu preservada em:

```text
/api/cs2/v2/
```
