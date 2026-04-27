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
    path: 'api-smoke',
    loadComponent: () =>
      import('./features/api-smoke/api-smoke').then((component) => component.ApiSmoke),
  },
];
