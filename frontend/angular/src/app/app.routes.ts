import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/overview/overview-page').then((component) => component.OverviewPage),
  },
  {
    path: 'api-smoke',
    loadComponent: () =>
      import('./features/api-smoke/api-smoke').then((component) => component.ApiSmoke),
  },
];
