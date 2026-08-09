import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home-page').then((component) => component.HomePage),
  },
  {
    path: 'ranking',
    loadComponent: () =>
      import('./features/ranking/ranking-page').then((component) => component.RankingPage),
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
    path: 'players/:slug',
    loadComponent: () =>
      import('./features/player-public-profile/player-public-profile-page').then(
        (component) => component.PlayerPublicProfilePage,
      ),
  },
  {
    path: 'area-do-jogador/estatisticas',
    loadComponent: () =>
      import('./features/bunker/bunker-page').then((component) => component.BunkerPage),
  },
  {
    path: 'area-do-jogador',
    loadComponent: () =>
      import('./features/player-area/player-area-page').then((component) => component.PlayerAreaPage),
  },
  {
    path: 'bunker',
    redirectTo: 'area-do-jogador/estatisticas',
    pathMatch: 'full',
  },
  {
    path: 'api-smoke',
    loadComponent: () =>
      import('./features/api-smoke/api-smoke').then((component) => component.ApiSmoke),
  },
];
