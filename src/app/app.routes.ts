import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/search/search-page.component').then((m) => m.SearchPageComponent)
  },
  {
    path: 'video/:id',
    loadComponent: () =>
      import('./features/detail/video-detail.component').then((m) => m.VideoDetailComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
