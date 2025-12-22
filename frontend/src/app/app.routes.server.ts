import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'users',
    renderMode: RenderMode.Server
  },
  {
    path: 'users/create',
    renderMode: RenderMode.Server
  },
  {
    path: 'products',
    renderMode: RenderMode.Server
  },
  {
    path: 'products/create',
    renderMode: RenderMode.Server
  },
  {
    path: 'products/edit/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Server
  }
];
