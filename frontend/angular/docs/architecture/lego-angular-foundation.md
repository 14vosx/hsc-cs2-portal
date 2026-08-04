# Architecture Document — Lego Angular Foundation

**Status:** Aprovado e Atualizado (Home & Shared Refactoring)
**Repositório:** `14vosx/hsc-cs2-portal`
**Caminho no Frontend:** `frontend/angular`

---

## 1. Propósito do Lego Angular

O programa **Lego Angular** visa transformar o HSC CS2 Portal Next em uma aplicação composta por peças estruturais, visuais e de estado reutilizáveis.

Princípios fundamentais:

1. **App Shell Único:** um shell responsivo coordenando header, navegação, sidebar desktop, drawer mobile e footer.
2. **Design System Próprio HSC:** preservação estrita da paleta de cores original HSC com liberdade completa para reconstrução de tipografia, espaçamentos, superfícies, bordas e animações.
3. **Fronteira Estrita de Dados:** DTOs pertencem exclusivamente à camada de transporte; componentes de apresentação e páginas recebem apenas modelos de domínio ou ViewModels normalizados.
4. **Isolamento de Domínio Puro:** regras determinísticas e tipos de domínio em TypeScript puro sem dependências do Angular, Router ou DOM.
5. **Diretório Compartilhado Canônico (`shared/components`):** o único diretório canônico de componentes reutilizáveis de apresentação é `src/app/shared/components`. O diretório `shared/ui` foi completamente removido.
6. **Uso Limitado do Angular CDK:** uso exclusivo do módulo `@angular/cdk/a11y` (`CdkTrapFocus`) para gerenciamento de travamento de foco acessível no Drawer Mobile. Não é utilizado Angular Material.

---

## 2. Responsabilidade das Camadas

```text
src/app/
├── core/         -> Infraestrutura global (HTTP, Config, Auth)
├── layout/       -> Shell, Header, Sidebar, PrimaryNav, Footer
├── shared/
│   ├── state/    -> Tipos de estado compartilhados (LoadState<T>)
│   └── components/ -> Componentes de UI canônicos (PageHeader, Card, StatusBadge, PageState, SectionHeader, etc.)
├── features/     -> Módulos funcionais encapsulados (Home, Seasons, Ranking, Matches, Maps, News, Bunker)
└── architecture/ -> Suíte automatizada de testes de limites arquiteturais
```

### Regras de Dependência (Imports)

* `features` → `shared`, `core`, próprio `domain`/`data-access`
* `layout` → `shared`, `core`
* `shared` → Angular/CDK padrão (`@angular/cdk/a11y`)
* `core` → infraestrutura
* **Proibido:** `shared` → `features`
* **Proibido:** `core` → `features`
* **Proibido:** `domain` → `@angular/*`, `Router`, DOM
* **Proibido:** `component`/`page` → Transport DTOs ou `HttpClient` diretamente
* **Proibido:** `home` → `overview`
* **Proibido:** `shared/ui` (diretório inexistente e sem imports permitidos)

---

## 3. Componentes Compartilhados Canônicos (`src/app/shared/components`)

| Componente | Selector | Responsabilidade |
|---|---|---|
| `AppShell` | `app-shell` | Shell global, landmarks semânticos, skip link, grid, coordenação de foco e drawer |
| `AppHeader` | `app-header` | Marca HSC CS2, botão toggle do drawer mobile |
| `AppSidebar` | `app-sidebar` | Painel lateral desktop e modal mobile |
| `PrimaryNav` | `app-primary-nav` | Catálogo e links de navegação primária com regras ativas |
| `AppFooter` | `app-footer` | Rodapé global institucional e metadados |
| `PageHeader` | `app-page-header` | Cabeçalho padronizado de página (eyebrow, título, descrição, ações) |
| `SectionHeader` | `app-section-header` | Cabeçalho de seções internas (suporta eyebrow, title, description, subtitle, action) |
| `UiCard` | `app-ui-card` | Container de superfície estrutural (`default`, `interactive`, `highlight`) |
| `StatusBadge` | `app-status-badge` | Badges semânticos de estado (`active`, `closed`, `neutral`, `warning`, `info`, `success`, `danger`) |
| `PageState` | `app-page-state` | Apresentação padronizada de estados assíncronos (`loading`, `empty`, `error`) |

---

## 4. Comportamento Acessível do Drawer Mobile

No mobile (largura < 992px), a navegação transiciona para um drawer modal acessível:

* **Trigger:** botão hamburger em `AppHeader` com `aria-expanded` e `aria-controls="mobile-drawer"`.
* **Superfície:** modal overlay fixo com `role="dialog"`, `aria-modal="true"`.
* **Focus Trap:** gerenciado via `@angular/cdk/a11y` (`cdkTrapFocus`).
* **Bloqueio de Scroll:** `document.body.style.overflow = 'hidden'` ao abrir; valor anterior preservado e restaurado ao fechar.
* **Devolução de Foco:** foco síncrono devolvido ao botão trigger de abertura ao fechar.
* **Fechamento:** por botão fechar no drawer, clique no backdrop, tecla Escape ou evento `NavigationEnd`.
* **Cleanup:** restauração automática de scroll no ciclo de vida de destruição.
* **Sem Angular Material:** implementação leve com CSS Vanilla e Angular CDK A11y.

---

## 5. Contrato da Home e Transição da Overview

A `HomePage` é a página inicial em `/`.

### Composição e Renderização Imediata:

1. **Identidade e Atalhos Renderizam Imediatamente:** a marca/hero `app-page-header` e a grade de atalhos em `home-page__shortcuts-grid` renderizam no primeiro frame sem bloquear aguardando HTTP.
2. **Região Sazonal:** inicia em estado `loading` e transiciona reativamente para o estado final.
3. **News Editorial:** inicia como `null` via `startWith(null)` e falhas são isoladas sem bloquear a página.
4. **Zero Requisições Duplicadas:** chamadas de API encapsuladas com `shareReplay({ bufferSize: 1, refCount: true })`.

### Estados Específicos da Home (`HomeSeasonState`):

* `loading`: carregamento inicial da região sazonal.
* `empty`: nenhuma temporada pública ativa ou encerrada resolvida.
* `ready`: métricas e dados de temporada carregados com sucesso.
* `seasons-error`: falha na busca do índice de temporadas (não é tratado como ausência de temporada pública).
* `ranking-error`: falha ao carregar o ranking de uma temporada resolvida, **preservando**:
  - `seasonSlug`;
  - `seasonName`;
  - `contextMode` (`active` ou `latest-closed`);
  - badge de status;
  - ação de navegação para a temporada.

### Cards Navegáveis:

* Cards de atalhos e navegação usam elementos semânticos `<a [routerLink]>` envolvendo `<app-ui-card>`, garantindo href real, foco visível, navegabilidade por teclado e zero links aninhados.

---

## 6. Limites Conhecidos e Próximos Marcos

* **Marco 2:** Migração de Ranking como página de referência de dados.
* **Marco 3:** Migração de Seasons e News.
* **Marco 4:** Migração de Matches e Maps.
* **Marco 5:** Migração de Player Bunker.
* **Marco 6:** Limpeza final de serviços amplos e preparação do pipeline de deploy.
