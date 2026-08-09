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

  it('route /players/:slug lazy-loads PlayerPublicProfilePage', async () => {
    const route = routes.find((candidate) => candidate.path === 'players/:slug');
    expect(route).toBeDefined();
    expect(route?.redirectTo).toBeUndefined();
    expect(route?.loadComponent).toBeDefined();

    const { PlayerPublicProfilePage } = await import(
      './features/player-public-profile/player-public-profile-page'
    );
    expect(await route!.loadComponent!()).toBe(PlayerPublicProfilePage);
  });

  it('lazy-loads email verification without changing player routes', async () => {
    const route = routes.find((candidate) => candidate.path === 'verify-email');
    const { VerifyEmailPage } = await import(
      './features/player-auth/verify-email-page/verify-email-page'
    );
    expect(await route!.loadComponent!()).toBe(VerifyEmailPage);
    expect(routes.some((candidate) => candidate.path === 'players/:slug')).toBe(true);
  });

  it('lazy-loads password reset and preserves Player Area routes', async () => {
    const route = routes.find((candidate) => candidate.path === 'reset-password');
    const { ResetPasswordPage } = await import(
      './features/player-auth/reset-password-page/reset-password-page'
    );
    expect(await route!.loadComponent!()).toBe(ResetPasswordPage);
    expect(routes.some((candidate) => candidate.path === 'area-do-jogador')).toBe(true);
    expect(routes.some((candidate) => candidate.path === 'area-do-jogador/estatisticas')).toBe(true);
  });
});
