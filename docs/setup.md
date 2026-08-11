# Setup operacional

## Aplicação Angular

A aplicação principal está em:

```text
frontend/angular/
```

Instale as dependências a partir desse diretório:

```bash
cd frontend/angular
npm ci
```

## Desenvolvimento local

Para subir somente o Angular:

```bash
npm start
```

Para desenvolvimento integrado com as APIs configuradas no proxy local:

```bash
npm run start:proxy
```

O proxy atual mantém os paths relativos usados pela aplicação e encaminha as integrações para as origens de desenvolvimento configuradas em `frontend/angular/proxy.conf.json`.

### Auth API local

O fluxo canônico de desenvolvimento usa a `hsc-auth-api` local através do proxy. Antes de testar autenticação, Área do Jogador, Bunker ou perfil, confirme que a Auth API está ativa na origem esperada pelo proxy.

Não substitua paths relativos por URLs absolutas no código apenas para desenvolvimento local.

### Static API v2

O frontend consome a Static API v2 por paths relativos. O proxy versionado aponta a fonte de desenvolvimento atualmente adotada pelo projeto.

Se for necessário testar contra mocks estáticos, sirva os fixtures em um servidor local que preserve a mesma estrutura de paths esperada pela aplicação e use um arquivo de proxy local temporário ao iniciar o Angular. Não versione contratos duplicados nem fixtures como documentação.

Exemplo de execução com uma configuração de proxy local externa ao repositório:

```bash
npx ng serve --proxy-config=/caminho/para/proxy-local.json
```

## Configuração de ambiente

O projeto não consome `.env.local` ou variáveis de build atualmente. Configurações de integração são resolvidas pelos paths definidos no código e pelo proxy do Angular CLI.

Não adicione mecanismo de environment apenas para documentação. Se o projeto passar a suportar variáveis de build no futuro, documente somente os nomes públicos efetivamente consumidos pelo código.

## Validação

Testes:

```bash
npm test
```

Build de produção:

```bash
npm run build
```

Validação básica de diff:

```bash
git diff --check
git diff --stat
```

O projeto não possui script `lint` dedicado atualmente. A ausência desse script não deve ser mascarada na documentação.

## Build em subpath

Quando a aplicação precisar ser gerada para publicação em um subpath, use o mecanismo `base-href` do Angular CLI definido para o ambiente de publicação correspondente. O valor concreto pertence à configuração operacional do ambiente, não ao contrato funcional da aplicação.

## Regras de segurança

- Não commitar arquivos contendo credenciais ou secrets.
- Não registrar cookies ou tokens em documentação, logs de exemplo ou fixtures.
- Não publicar `src/`, `node_modules/` ou arquivos de configuração no webroot.
- Não usar diretório público como working tree Git.
- Mudanças de Nginx, deploy ou cutover exigem tarefa própria e aprovação explícita.
