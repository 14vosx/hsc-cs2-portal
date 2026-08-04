import { describe, expect, it } from 'vitest';

import { routes } from './app.routes';
import { RankingPage } from './features/ranking/ranking-page';
import { SeasonRankingPage } from './features/seasons/season-ranking-page/season-ranking-page';

describe('App Routes — Ranking Marco 2', () => {
  it('rota /ranking deve carregar RankingPage', async () => {
    const route = routes.find((r) => r.path === 'ranking');
    expect(route).toBeDefined();
    expect(route?.redirectTo).toBeUndefined();
    expect(route?.loadComponent).toBeDefined();

    const component = await route!.loadComponent!();
    expect(component).toBe(RankingPage);
  });

  it('rota /seasons/current/ranking deve continuar carregando SeasonRankingPage', async () => {
    const route = routes.find((r) => r.path === 'seasons/current/ranking');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();

    const component = await route!.loadComponent!();
    expect(component).toBe(SeasonRankingPage);
  });

  it('rota /seasons/:slug/ranking deve continuar carregando SeasonRankingPage', async () => {
    const route = routes.find((r) => r.path === 'seasons/:slug/ranking');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();

    const component = await route!.loadComponent!();
    expect(component).toBe(SeasonRankingPage);
  });
});
