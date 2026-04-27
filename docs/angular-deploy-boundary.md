# Portal CS2 — Angular Deploy Boundary

## Estado atual

O Portal CS2 legado ainda é servido diretamente a partir de:

/var/www/portal/cs2

A aplicação Angular foi criada em:

frontend/angular

Ela ainda não deve ser publicada na VPS.

## Regra crítica

Não executar `git pull` cego em `/var/www/portal/cs2` enquanto a `main` contiver `frontend/angular`.

Motivo:

- `/var/www/portal/cs2` é webroot público do Nginx.
- Se o repo inteiro for atualizado na VPS, o código-fonte Angular pode ficar acessível publicamente em `/portal/cs2/frontend/angular/...`.
- O deploy correto do Angular deve publicar apenas o conteúdo gerado pelo build.

## Fluxo seguro futuro

1. Desenvolver localmente em `frontend/angular`.
2. Rodar `npm run start:proxy` para consumir a API real via proxy local.
3. Validar build com `npm run build`.
4. Publicar somente o output estático gerado em `frontend/angular/dist/...`.
5. Definir destino controlado no Nginx antes de substituir o portal atual.
6. Preservar o portal legado até validação final.

## Fora de escopo neste momento

- Alterar Nginx.
- Alterar ETL.
- Alterar Static API v2.
- Fazer deploy do Angular.
- Substituir `/portal/cs2` em produção.
