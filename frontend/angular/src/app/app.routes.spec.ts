import { describe, expect, it } from 'vitest';

import { routes } from './app.routes';
import { RankingPage } from './features/ranking/ranking-page';
import { SeasonRankingPage } from './features/seasons/season-ranking-page/season-ranking-page';

describe('App Routes', () => {
  it('ranking lazy-loads RankingPage', async () => {
    const route = routes.find((r) => r.path === 'ranking');
    expect(route).toBeDefined();
    expect(route?.redirectTo).toBeUndefined();
    expect(route?.loadComponent).toBeDefined();

    const component = await route!.loadComponent!();
    expect(component).toBe(RankingPage);
  });

  it('current season ranking lazy-loads SeasonRankingPage', async () => {
    const route = routes.find((r) => r.path === 'seasons/current/ranking');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();

    const component = await route!.loadComponent!();
    expect(component).toBe(SeasonRankingPage);
  });

  it('season slug ranking lazy-loads SeasonRankingPage', async () => {
    const route = routes.find((r) => r.path === 'seasons/:slug/ranking');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();

    const component = await route!.loadComponent!();
    expect(component).toBe(SeasonRankingPage);
  });

  it('public player profile route lazy-loads PlayerPublicProfilePage', async () => {
    const route = routes.find((candidate) => candidate.path === 'players/:slug');
    expect(route).toBeDefined();
    expect(route?.redirectTo).toBeUndefined();
    expect(route?.loadComponent).toBeDefined();

    const { PlayerPublicProfilePage } = await import(
      './features/player-public-profile/player-public-profile-page'
    );
    expect(await route!.loadComponent!()).toBe(PlayerPublicProfilePage);
  });

  it('email verification route lazy-loads VerifyEmailPage', async () => {
    const route = routes.find((candidate) => candidate.path === 'verify-email');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();

    const { VerifyEmailPage } = await import(
      './features/player-auth/verify-email-page/verify-email-page'
    );
    expect(await route!.loadComponent!()).toBe(VerifyEmailPage);
  });

  it('password reset route lazy-loads ResetPasswordPage', async () => {
    const route = routes.find((candidate) => candidate.path === 'reset-password');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();

    const { ResetPasswordPage } = await import(
      './features/player-auth/reset-password-page/reset-password-page'
    );
    expect(await route!.loadComponent!()).toBe(ResetPasswordPage);
  });

  it('email linking route lazy-loads LinkEmailPage', async () => {
    const route = routes.find((candidate) => candidate.path === 'link-email');
    expect(route).toBeDefined();
    expect(route?.loadComponent).toBeDefined();

    const { LinkEmailPage } = await import(
      './features/player-account-security/link-email-page/link-email-page'
    );
    expect(await route!.loadComponent!()).toBe(LinkEmailPage);
  });
});
