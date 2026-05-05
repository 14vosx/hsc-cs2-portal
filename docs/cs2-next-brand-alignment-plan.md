# Portal CS2 Next — Plano de alinhamento com identidade HSC

## Contexto

Este documento planeja a aplicação da identidade visual HSC no novo Portal CS2 Angular, localizado em:

```text
frontend/angular
```

O Portal CS2 Next já existe em staging em:

```text
https://haxixesmokeclub.com/portal/cs2-next/
```

O portal legado continua sendo a produção principal em:

```text
https://haxixesmokeclub.com/portal/cs2/
```

Este plano não executa deploy, não altera Nginx, não altera ETL e não substitui o portal legado.

## Referências

Repositórios relevantes:

```text
https://github.com/14vosx/hsc-brand-hub
https://github.com/14vosx/hsc-cs2-portal
```

Documentação de identidade no Brand Hub:

```text
hsc-brand-hub/docs/brand-identity-baseline.md
```

Documentos locais relacionados:

```text
docs/angular-migration-status.md
docs/angular-deploy-boundary.md
docs/angular-deploy-plan.md
docs/angular-staging-deploy.md
docs/security-hardening-cs2-webroot.md
```

## Diretriz principal

O Portal CS2 Next deve usar a identidade do HSC como base, mas não deve copiar o layout do Brand Hub.

Princípio central:

```text
Identidade, não cópia.
Competição, não dashboard.
Clube, não sistema.
Dados como experiência, não como debug.
```

## Fora de escopo

Não faz parte desta frente:

```text
- copiar o layout da homepage;
- transformar o Portal em clone do Brand Hub;
- fazer cutover do portal legado;
- alterar Nginx;
- alterar Static API v2;
- alterar ETL;
- alterar backend;
- publicar build na VPS;
- introduzir dependências novas sem aprovação;
- aumentar CSS budget sem aprovação.
```

## Diagnóstico do estado atual

O Angular atual já tem uma base funcional, mas ainda comunica mais "dashboard operacional" do que "portal competitivo player-facing".

Sinais atuais a corrigir:

```text
- vermelho como cor primária;
- amber como cor de ranking;
- header com marca textual em caixa "HSC";
- navegação com aparência de chips/botões;
- cards muito blocados;
- métricas com cara de painel;
- termos técnicos expostos em telas públicas;
- textos como "API online", "Static API v2", "Build local", "cache", "busca local" e "Panorama operacional".
```

O objetivo não é trocar vermelho por cyan de forma superficial. O objetivo é redesenhar a experiência pública para parecer um portal competitivo do clube.

## Tokens visuais a aplicar

### Dark foundation

Tokens de referência:

```css
--hsc-dark-04: #05080b;
--hsc-dark-06: #080c10;
--hsc-dark-08: #0b1015;
--hsc-dark-10: #10161c;
--hsc-dark-12: #141b22;
--hsc-dark-15: #1a232d;
```

Aplicação no Portal:

```text
- fundo principal;
- seções de conteúdo;
- superfícies elevadas;
- cards de ranking/partidas/mapas;
- áreas de destaque.
```

### Cyan accent

Tokens de referência:

```css
--hsc-cyan-50: #e8f8ff;
--hsc-cyan-60: #beefff;
--hsc-cyan-70: #7fe2ff;
--hsc-cyan-80: #32d1ff;
--hsc-cyan-90: #1da7f2;
--hsc-cyan-95: #0e7fd1;
```

Aplicação no Portal:

```text
- CTAs principais;
- destaque de ranking;
- pódio;
- estados ativos;
- links importantes;
- pequenos glows controlados.
```

Não usar cyan em excesso. O acento deve guiar atenção, não dominar a interface.

### Texto

Tokens de referência:

```css
--hsc-white: #f3f8fb;
--hsc-grey-50: #6f7d89;
--hsc-grey-60: #8896a2;
--hsc-grey-70: #a2afb8;
--hsc-grey-80: #c1cbd2;
--hsc-grey-90: #dce3e8;
--hsc-grey-95: #eef3f6;
```

Aplicação no Portal:

```text
- placares, nomes e rankings com contraste alto;
- metadados em cinza frio;
- informações técnicas em baixa prioridade;
- evitar metadados competindo com score, vencedor ou CTA.
```

## Tom verbal player-facing

Substituições recomendadas:

```text
"Visão Geral" -> "Clube", "Temporada" ou "Portal CS2"
"Panorama operacional" -> "temporada, partidas e rankings do clube"
"API online" -> remover da home pública
"Saúde da API" -> remover da home pública
"Static API v2" -> manter apenas em /api-smoke
"Build local" -> remover da experiência pública
"cache" -> evitar em telas públicas
"busca local" -> "buscar jogador", "filtrar partidas", "explorar mapas"
```

Tom desejado:

```text
- competitivo;
- comunitário;
- direto;
- premium;
- noturno;
- confiante;
- sem parecer painel administrativo.
```

## Direção de layout

O Portal deve funcionar como uma experiência pública de competição.

Direção:

```text
- hero editorial/competitivo;
- placares e ranking como conteúdo principal;
- cards com hierarquia visual, não blocos iguais;
- links contextuais entre ranking, partidas e mapas;
- menos metadado técnico;
- mais narrativa de temporada;
- mais foco em jogador, time, placar, mapa e posição.
```

Evitar:

```text
- grid técnico decorativo;
- cards genéricos demais;
- excesso de bordas;
- chips agressivos;
- tabelas com cara de backoffice;
- layout totalmente simétrico quando o conteúdo pede destaque.
```

## Ordem recomendada de execução

### Fase 1 — Tokens e shell

Objetivo:

```text
Aplicar identidade base sem mexer em contratos de API.
```

Escopo provável:

```text
frontend/angular/src/styles.css
frontend/angular/src/app/core/layout/portal-shell/*
frontend/angular/src/app/core/layout/portal-header/*
frontend/angular/src/app/core/layout/portal-footer/*
frontend/angular/src/app/shared/components/*
```

Resultado esperado:

```text
- trocar identidade visual vermelha/amber por dark/cyan HSC;
- melhorar header para usar marca com mais personalidade;
- remover aparência de dashboard/chips;
- ajustar cards compartilhados para parecerem portal competitivo;
- preservar rotas e comportamento.
```

Validação:

```text
cd frontend/angular
npm run build
```

### Fase 2 — Home/Overview player-facing

Objetivo:

```text
Transformar a home do cs2-next em entrada pública do Portal CS2.
```

Escopo provável:

```text
frontend/angular/src/app/features/overview/*
```

Resultado esperado:

```text
- remover linguagem técnica;
- reduzir "painel de métricas";
- destacar temporada, líder, última partida e mapas como conteúdo editorial;
- manter dados reais existentes;
- não inventar dados ausentes.
```

### Fase 3 — Ranking da Season

Objetivo:

```text
Criar a primeira UI player-facing da Season ativa.
```

Contratos a consumir:

```text
/api/cs2/v2/seasons.json
/api/cs2/v2/season/s01-2026.json
/api/cs2/v2/season/s01-2026/ranking.json
```

Escopo provável:

```text
frontend/angular/src/app/core/config/api-paths.ts
frontend/angular/src/app/core/api/cs2-api.service.ts
frontend/angular/src/app/core/api/dto/*
frontend/angular/src/app/features/ranking/*
```

Resultado esperado:

```text
- hero da Season ativa;
- resumo competitivo;
- pódio Top 3;
- tabela completa;
- regras/elegibilidade;
- aviso de premiação.
```

Texto aprovado:

```text
Top 3 da Season serão premiados. Premiação será anunciada em breve.
```

Regras a exibir:

```text
- ranking baseado apenas nos mapas válidos da Season;
- mapas válidos têm vencedor, pelo menos 12 rounds e end_time dentro da janela da Season;
- para concorrer ao Top 3 premiável:
  - mínimo de 5 mapas válidos;
  - mínimo de 100 rounds jogados.
```

### Fase 4 — Partidas e mapas

Objetivo:

```text
Refinar experiência de navegação e leitura competitiva.
```

Escopo provável:

```text
frontend/angular/src/app/features/matches/*
frontend/angular/src/app/features/maps/*
```

Resultado esperado:

```text
- placar mais dominante;
- vencedor mais claro;
- links contextuais mais fortes;
- mapas com leitura menos blocada;
- manter CTAs para detalhe de partida e detalhe de mapa.
```

## Riscos

### Risco 1 — mudar só tokens e manter cara de dashboard

Mitigação:

```text
Tratar linguagem, hierarquia e layout como parte do trabalho, não apenas CSS.
```

### Risco 2 — copiar demais o Hub

Mitigação:

```text
Usar paleta, tom e atmosfera; não replicar seções, hero ou grid da homepage.
```

### Risco 3 — estourar CSS budget

Mitigação:

```text
Mudanças pequenas, remover duplicação e rodar npm run build antes de finalizar.
```

### Risco 4 — inventar dados ausentes

Mitigação:

```text
Usar apenas payloads existentes da Static API v2.
Se o dado não existir, omitir ou tratar como indisponível.
```

### Risco 5 — quebrar staging

Mitigação:

```text
Preservar rotas atuais.
Validar localmente com npm run start:proxy quando houver mudança de código.
Build de staging deve continuar usando --base-href=/portal/cs2-next/.
```

## Critérios de aceite para implementação futura

A frente de implementação só deve ser considerada pronta quando:

```text
- build Angular passar sem warnings;
- rotas atuais continuarem funcionando;
- /api-smoke continuar técnico e isolado;
- páginas públicas não expuserem linguagem de debug/API;
- identidade dark/cyan estiver aplicada de forma consistente;
- Portal não parecer cópia do Hub;
- Portal não parecer dashboard administrativo;
- Season Ranking usar dados reais da Static API v2.
```

## Próxima decisão

Recomendação de execução:

```text
Começar pela Fase 1: tokens e shell.
```

A Fase 1 cria base visual segura para depois redesenhar home e ranking sem retrabalho.
