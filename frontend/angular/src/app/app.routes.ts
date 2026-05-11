import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/overview/overview-page').then((component) => component.OverviewPage),
  },
  {
    path: 'ranking',
    redirectTo: 'seasons/current/ranking',
    pathMatch: 'full',
  },
  {
    path: 'seasons',
    loadComponent: () =>
      import('./features/seasons/seasons-page').then((component) => component.SeasonsPage),
  },
  {
    path: 'seasons/current',
    loadComponent: () =>
      import('./features/seasons/season-detail-page/season-detail-page').then(
        (component) => component.SeasonDetailPage,
      ),
  },
  {
    path: 'seasons/current/ranking',
    loadComponent: () =>
      import('./features/seasons/season-ranking-page/season-ranking-page').then(
        (component) => component.SeasonRankingPage,
      ),
  },
  {
    path: 'seasons/current/matches',
    loadComponent: () =>
      import('./features/seasons/season-matches-page/season-matches-page').then(
        (component) => component.SeasonMatchesPage,
      ),
  },
  {
    path: 'seasons/current/maps',
    loadComponent: () =>
      import('./features/seasons/season-maps-page/season-maps-page').then(
        (component) => component.SeasonMapsPage,
      ),
  },
  {
    path: 'seasons/:slug/ranking',
    loadComponent: () =>
      import('./features/seasons/season-ranking-page/season-ranking-page').then(
        (component) => component.SeasonRankingPage,
      ),
  },
  {
    path: 'seasons/:slug/matches',
    loadComponent: () =>
      import('./features/seasons/season-matches-page/season-matches-page').then(
        (component) => component.SeasonMatchesPage,
      ),
  },
  {
    path: 'seasons/:slug/maps',
    loadComponent: () =>
      import('./features/seasons/season-maps-page/season-maps-page').then(
        (component) => component.SeasonMapsPage,
      ),
  },
  {
    path: 'seasons/:slug',
    loadComponent: () =>
      import('./features/seasons/season-detail-page/season-detail-page').then(
        (component) => component.SeasonDetailPage,
      ),
  },
  {
    path: 'matches',
    loadComponent: () =>
      import('./features/matches/matches-page').then((component) => component.MatchesPage),
  },
  {
    path: 'matches/:matchId',
    loadComponent: () =>
      import('./features/matches/match-detail-page/match-detail-page').then(
        (component) => component.MatchDetailPage,
      ),
  },
  {
    path: 'maps',
    loadComponent: () =>
      import('./features/maps/maps-page').then((component) => component.MapsPage),
  },
  {
    path: 'maps/:map',
    loadComponent: () =>
      import('./features/maps/map-detail-page/map-detail-page').then(
        (component) => component.MapDetailPage,
      ),
  },
  {
    path: 'news',
    loadComponent: () => import('./features/news/news-page').then((component) => component.NewsPage),
  },
  {
    path: 'news/:slug',
    loadComponent: () =>
      import('./features/news/news-detail-page/news-detail-page').then(
        (component) => component.NewsDetailPage,
      ),
  },
  {
    path: 'bunker',
    loadComponent: () =>
      import('./features/bunker/bunker-page').then((component) => component.BunkerPage),
  },
  {
    path: 'api-smoke',
    loadComponent: () =>
      import('./features/api-smoke/api-smoke').then((component) => component.ApiSmoke),
  },
];
