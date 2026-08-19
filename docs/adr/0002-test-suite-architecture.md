# ADR 0002 — Arquitetura e regras da test suite

## Status

Aceita

## Contexto

A aplicação Angular do HSC CS2 Portal utiliza Vitest como runner e cresceu com diferentes necessidades de testes (domínio puro, integração de dados, componentes e políticas arquiteturais).

Para garantir que a suíte permaneça sustentável, rápida e de fácil manutenção por um desenvolvedor ao longo do ciclo de vida do produto, é necessário formalizar uma arquitetura de testes orientada a contratos observáveis e simplicidade operacional, evitando arquitetura ornamental, acoplamento à implementação interna, frameworks internos complexos ou métricas artificiais de cobertura e contagem de testes.

## Decisão

Adota-se uma arquitetura de testes enxuta baseada em primitives nativas Angular/Vitest, guiada pelos seguintes princípios e decisões normativas:

### Categorias Conceituais de Testes

Os testes são classificados conceitualmente em cinco categorias funcionais (sem reorganização física compulsória de diretórios):

- **A — Pure / Domain & Configuration Contract**:
  - *Propósito*: Normalizers, formatters puros, validação, error mapping puro, view-model derivation pura e configuração estática relevante (ex.: route configuration quando testável sem runtime).
  - *Características*: Sem `TestBed` quando desnecessário, sem DOM, sem runtime Angular dispensável; foco em entrada -> saída / contrato. Idealmente zero mocks.
- **B — Data-access / Adapter Contract**:
  - *Propósito*: Serviços HTTP, storage/browser adapters, wrappers de APIs externas e tradução entre fronteiras externas e domínio da aplicação.
  - *Características*: Preferência por ferramentas nativas da fronteira arquitetural (ex.: `HttpTestingController` para testar o adapter real contra fronteira HTTP controlada).
- **C — Angular Component Behavior**:
  - *Propósito*: Comportamento observável de componentes (inputs, estado público, DOM renderizado, interação do usuário, outputs e apresentação observável).
  - *Características*: Foco no que o usuário ou o consumidor do componente observa; evitar assertions sobre detalhes internos de implementação. Serviços externos podem ser mocks/fakes nas fronteiras quando necessário.
- **D — Feature Integration**:
  - *Propósito*: Contratos que exigem múltiplas unidades reais trabalhando em conjunto de ponta a ponta.
  - *Características*: Explícitos, seletivos e relativamente raros. Não transformar todo component spec em integration test.
- **E — Architecture Policy**:
  - *Propósito*: Proteção de invariantes arquiteturais duráveis do repositório.
  - *Características*: Não registrar decisões históricas, migrações passadas ou detalhes transitórios de PRs como política permanente.

### Regras Arquiteturais Normativas

- **HSC-PORTAL-TEST-01**: Vitest é o único test runner da aplicação Angular.
- **HSC-PORTAL-TEST-02**: Os testes são conceitualmente classificados nas cinco categorias (A — Pure/Domain, B — Data-access/Adapter, C — Component Behavior, D — Feature Integration, E — Architecture Policy), sem exigência de reorganização física em diretórios A/B/C/D/E.
- **HSC-PORTAL-TEST-03**: Testes devem proteger comportamento observável ou contratos relevantes, não detalhes incidentais de implementação.
- **HSC-PORTAL-TEST-04**: Código de produção não deve receber APIs, métodos, modificadores de visibilidade ou mecanismos criados exclusivamente para permitir testes. Testes não devem obter acesso privilegiado à implementação para furar encapsulamento (ex.: subclasses `TestableXxx`, `component['privateMember']`, casts ou harnesses usados apenas para acessar internals, ou transformar `private`/`protected` em `public` exclusivamente para teste).
- **HSC-PORTAL-TEST-05**: Helpers, fixtures, builders e abstrações compartilhadas só devem existir quando houver reutilização real comprovada e quando reduzirem a complexidade total. Duplicação pequena e explícita é preferível a criar um framework interno de testes.
- **HSC-PORTAL-TEST-06**: Feature Integration tests devem ser explícitos, seletivos e relativamente raros, evitando transformar todo component spec em teste de integração.
- **HSC-PORTAL-TEST-07**: Fake timers devem ser usados somente quando tempo, polling, deadline, TTL, countdown ou comportamento temporal equivalente fizer parte real do contrato testado.
- **HSC-PORTAL-TEST-08**: Não existe meta artificial de coverage; testes não devem ser escritos apenas para inflar percentuais de cobertura.
- **HSC-PORTAL-TEST-09**: Architecture Policy tests devem proteger somente invariantes arquiteturais duráveis, não servindo de arquivo executável para histórico de migrações ou PRs passados.
- **HSC-PORTAL-TEST-10**: A quantidade total de testes não é uma métrica de sucesso. A contagem pode diminuir quando testes duplicados, tautológicos ou sem valor contratual forem removidos, desde que a proteção relevante seja preservada ou melhorada.
- **HSC-PORTAL-TEST-11**: Nenhuma nova dependência de testing deve ser adicionada sem uma dor recorrente concreta e demonstrada que as primitives atuais não resolvam adequadamente.
- **HSC-PORTAL-TEST-12**: Preferir primitives nativas Angular/Vitest a abstrações ou frameworks de testing específicos do projeto. Não introduzir bibliotecas externas de teste (Testing Library, Spectator, ng-mocks, MSW, etc.) sem necessidade demonstrada.
- **HSC-PORTAL-TEST-13**: *Mock boundaries, not internals.* Mocks devem substituir fronteiras da unidade sob teste (ex.: HTTP, storage, serviços externos em componentes, harness real de Router para routing), nunca a própria implementação interna que está sendo testada, nem recorrer a spies de métodos internos para viabilizar assertions.

## Consequências

- **Positivas**:
  - Testes mais resilientes a refatorações internas que preservam contratos e comportamentos.
  - Redução drástica de boilerplate e menor dependência de abstrações ou frameworks customizados.
  - Execução rápida e determinística aproveitando a velocidade do Vitest e suites sem `TestBed` desnecessário em contratos puros.
  - Clareza para desenvolvedores e agentes sobre onde e como testar cada camada da aplicação.
- **Trade-offs e Limitações**:
  - Requer disciplina para não furar encapsulamento ou criar atalhos de visibilidade em código de produção.
  - Dispensa a conveniência imediata de bibliotecas terceiras de testing (ex.: ng-mocks, Testing Library) em favor de primitives nativas Angular/Vitest até que uma dor concreta justifique adoções futuras.
