import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/overview/overview-page').then((component) => component.OverviewPage),
  },
  {
    path: 'ranking',
    loadComponent: () =>
      import('./features/ranking/ranking-page').then((component) => component.RankingPage),
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
    path: 'api-smoke',
    loadComponent: () =>
      import('./features/api-smoke/api-smoke').then((component) => component.ApiSmoke),
  },
];
