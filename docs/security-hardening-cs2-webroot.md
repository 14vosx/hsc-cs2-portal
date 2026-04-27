# HSC Portal CS2 — Hardening do Webroot Legado

## Status

Este documento registra uma correcao operacional de seguranca realizada no webroot legado do HSC Portal CS2.

A correcao foi executada durante a etapa de validacao somente-leitura da VPS para o futuro deploy seguro do Angular.

Embora a etapa original fosse somente de leitura, foi encontrado um risco critico em producao e a acao corretiva foi executada de forma controlada.

## Contexto

Portal legado em producao:

```text
/var/www/portal/cs2
```

URL publica correspondente:

```text
/portal/cs2/
```

Arquivo Nginx ativo identificado:

```text
/etc/nginx/conf.d/srv1353392.hstgr.cloud.conf
```

Server names atendidos pelo mesmo bloco:

```text
haxixesmokeclub.com
www.haxixesmokeclub.com
srv1353392.hstgr.cloud
```

## Achado critico

Durante a auditoria do filesystem publico, foi encontrado um repositorio Git dentro do webroot legado:

```text
/var/www/portal/cs2/.git
/var/www/portal/cs2/.gitignore
```

Isso contrariava a fronteira de deploy definida para o projeto:

```text
repositorio-fonte != diretorio publico
```

## Impacto confirmado

A exposicao foi confirmada via HTTP.

Antes da correcao, estes caminhos retornavam `200` com conteudo real:

```text
/portal/cs2/.git/HEAD
/portal/cs2/.git/config
/portal/cs2/.gitignore
```

Conteudos observados:

```text
ref: refs/heads/main
```

E em `.git/config`:

```text
[core]
repositoryformatversion = 0
filemode = true
bare = false
logallrefupdates = true

[remote "origin"]
url = git@github.com:14vosx/hsc-cs2-portal.git
fetch = +refs/heads/*:refs/remotes/origin/*
```

## Classificacao

Classificacao do risco:

```text
critico
```

Motivo:

* metadados Git estavam dentro do webroot publico;
* o Nginx servia arquivos reais de `.git`;
* o endpoint `.git/config` revelava o remote do repositorio;
* esse estado permitiria enumeracao de metadados Git caso outros objetos estivessem acessiveis;
* a situacao reforcava a proibicao de `git pull` dentro de `/var/www/portal/cs2`.

## Escopo da correcao

A correcao foi limitada a:

```text
/var/www/portal/cs2/.git
/var/www/portal/cs2/.gitignore
/etc/nginx/conf.d/srv1353392.hstgr.cloud.conf
```

Nao foram alterados:

```text
/var/www/portal/cs2/index.html
/var/www/portal/cs2/ranking
/var/www/portal/cs2/matches
/var/www/portal/cs2/maps
/var/www/api/cs2/v2
/var/www/brand-hub/current
/var/www/portal/cs2-next
```

Nao houve deploy Angular nesta correcao.

## Contencao executada

Antes da remocao, foi criado snapshot restrito em:

```text
/root/hsc-security-snapshots/cs2-webroot-git-exposed-20260427T214910Z.tar.gz
```

Permissoes do snapshot:

```text
-rw------- root root
```

O snapshot foi armazenado fora do webroot publico, em diretorio restrito:

```text
/root/hsc-security-snapshots
```

## Erradicacao executada

Foram removidos do webroot publico:

```text
/var/www/portal/cs2/.git
/var/www/portal/cs2/.gitignore
```

Validacao de filesystem apos a remocao:

```text
REMOVED_OK: /var/www/portal/cs2/.git
REMOVED_OK: /var/www/portal/cs2/.gitignore
```

## Hardening Nginx

Apos a remocao fisica, foi adicionada uma regra especifica no Nginx para impedir que dotfiles diretos sob `/portal/cs2/` caiam no fallback da SPA.

Regra aplicada:

```nginx
# HSC SECURITY - deny direct hidden files under /portal/cs2
# Prevents .git, .env, .gitignore and similar paths from falling through to the SPA fallback.
location ^~ /portal/cs2/. {
    return 404;
}
```

Local da regra no arquivo ativo:

```text
/etc/nginx/conf.d/srv1353392.hstgr.cloud.conf
```

A regra foi inserida antes do bloco principal do Portal CS2:

```nginx
location /portal/cs2/ {
    alias /var/www/portal/cs2/;
    try_files $uri $uri/ /portal/cs2/index.html;
}
```

## Por que a regra e necessaria

Mesmo apos remover `.git`, o fallback SPA poderia transformar acessos a caminhos inexistentes em `200` com `index.html`.

Exemplo de comportamento ruim:

```text
/portal/cs2/.git/HEAD -> 200 com HTML do portal
```

Isso nao vazava mais conteudo Git, mas era ruim para seguranca e observabilidade.

Com o hardening, o comportamento correto passou a ser:

```text
/portal/cs2/.git/HEAD -> 404
/portal/cs2/.git/config -> 404
/portal/cs2/.gitignore -> 404
/portal/cs2/.env -> 404
```

## Backups de configuracao Nginx

Foram preservados snapshots restritos do arquivo Nginx antes das alteracoes:

```text
/root/hsc-security-snapshots/srv1353392.hstgr.cloud.conf.pre-dotfile-deny-20260427T215135Z
/root/hsc-security-snapshots/srv1353392.hstgr.cloud.conf.pre-dotfile-prefix-deny-20260427T215301Z
```

## Validacao Nginx

Antes do reload, foi executado:

```bash
nginx -t
```

Resultado:

```text
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Depois disso, foi executado reload controlado:

```bash
systemctl reload nginx
```

Status apos reload:

```text
active
```

Observacao: o Nginx mostrou warnings sobre `listen ... http2` depreciado. Esses warnings ja existiam no ambiente e nao bloquearam a correcao.

## Validacao final de filesystem

Apos a correcao, os seguintes itens foram validados como ausentes no webroot legado:

```text
OK_NOT_FOUND: /var/www/portal/cs2/.git
OK_NOT_FOUND: /var/www/portal/cs2/.gitignore
OK_NOT_FOUND: /var/www/portal/cs2/.env
OK_NOT_FOUND: /var/www/portal/cs2/package.json
OK_NOT_FOUND: /var/www/portal/cs2/angular.json
OK_NOT_FOUND: /var/www/portal/cs2/tsconfig.json
OK_NOT_FOUND: /var/www/portal/cs2/frontend
OK_NOT_FOUND: /var/www/portal/cs2/node_modules
OK_NOT_FOUND: /var/www/portal/cs2/src
```

Tambem foi executada varredura nos webroots publicos relevantes:

```text
/var/www/portal
/var/www/api
/var/www/brand-hub
```

Nao foram encontrados:

```text
package.json
package-lock.json
angular.json
tsconfig*.json
.env
.git
.github
.gitignore
.npmrc
```

## Validacao HTTP final

Resultado esperado e validado:

```text
404 /portal/cs2/.git/HEAD
404 /portal/cs2/.git/config
404 /portal/cs2/.gitignore
404 /portal/cs2/.env
200 /portal/cs2/
200 /portal/cs2/ranking/
200 /portal/cs2/matches/
200 /portal/cs2/maps/
200 /api/cs2/v2/health.json
200 /api/cs2/v2/ranking.json
200 /content/news/
```

## Validacao multi-host

A validacao foi repetida para os tres hostnames do server block:

```text
haxixesmokeclub.com
www.haxixesmokeclub.com
srv1353392.hstgr.cloud
```

Resultado para todos:

```text
404 /portal/cs2/.git/HEAD
404 /portal/cs2/.git/config
404 /portal/cs2/.gitignore
404 /portal/cs2/.env
200 /portal/cs2/index.html
200 /api/cs2/v2/health.json
200 /content/news/
```

## Auditoria de logs

Foram pesquisados acessos a dotfiles e `.git` nos logs do Nginx:

```text
/var/log/nginx/access.log
/var/log/nginx/error.log
logs rotacionados/comprimidos disponiveis
```

O resultado encontrado nos logs ativos correspondeu aos testes locais feitos durante a investigacao:

```text
127.0.0.1 ... "GET /portal/cs2/.git/HEAD ..."
127.0.0.1 ... "GET /portal/cs2/.git/config ..."
127.0.0.1 ... "GET /portal/cs2/.gitignore ..."
```

Antes da correcao, os testes locais retornaram `200` com conteudo real.

Depois da correcao, os testes locais retornaram `404`.

Nao houve evidencia nos logs disponiveis de acesso externo a esses caminhos.

Observacao: ausencia de evidencia nos logs atuais nao prova que nunca houve acesso externo historico. Significa apenas que, nos logs disponiveis no momento da auditoria, nao foi encontrado acesso externo.

## Estado final

Estado final aprovado:

```text
.git removido fisicamente de /var/www/portal/cs2
.gitignore removido fisicamente de /var/www/portal/cs2
Nginx bloqueando /portal/cs2/.*
validacao multi-host aprovada
varredura de webroots publicos limpa
logs atuais sem evidencia de acesso externo
portal legado funcionando
API funcionando
content mirror funcionando
```

## Regras permanentes

A partir deste hardening, continuam obrigatorias as regras:

```text
Nao fazer git pull dentro de /var/www/portal/cs2
Nao transformar webroot publico em working tree Git
Nao publicar repositorio-fonte no Nginx
Nao publicar frontend/angular/src
Nao publicar node_modules
Nao publicar package.json, angular.json, tsconfig*.json ou .git
Publicar somente artefatos estaticos gerados pelo build
```

## Relacao com deploy Angular

Este incidente reforca o plano definido em:

```text
docs/angular-deploy-plan.md
docs/angular-deploy-boundary.md
docs/angular-migration-status.md
```

Para o Angular, o modelo correto permanece:

```text
build Angular
  -> publicar somente dist/hsc-cs2-portal-angular/browser/*
  -> usar staging isolado em /portal/cs2-next/
  -> nunca usar git pull dentro do webroot
```

## Fora do escopo desta correcao

Esta correcao nao executou:

```text
deploy Angular
criacao de /var/www/portal/cs2-next
alteracao de /var/www/api/cs2/v2
alteracao de ETL
alteracao de conteudo do portal legado
cutover
automacao de deploy
```

## Proxima etapa recomendada

Antes de continuar com o staging Angular, manter esta correcao documentada e versionada.

Depois disso, retomar o plano de deploy seguro do Angular pela etapa de validacao e criacao controlada do staging:

```text
/portal/cs2-next/
/var/www/portal/cs2-next
```
