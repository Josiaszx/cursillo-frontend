import { Routes } from '@angular/router';

import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'grupos' },
      {
        path: 'grupos',
        title: 'Grupos · Cursillo',
        loadComponent: () => import('./features/grupos/grupos-page').then((m) => m.GruposPage),
      },
      {
        path: 'grupos/:id',
        title: 'Detalle del grupo · Cursillo',
        loadComponent: () =>
          import('./features/grupos/grupo-detalle-page').then((m) => m.GrupoDetallePage),
      },
      {
        path: 'alumnos',
        title: 'Alumnos · Cursillo',
        loadComponent: () => import('./features/alumnos/alumnos-page').then((m) => m.AlumnosPage),
      },
      {
        path: 'profesores/:ci',
        title: 'Detalle del profesor · Cursillo',
        loadComponent: () =>
          import('./features/profesores/profesor-detalle-page').then((m) => m.ProfesorDetallePage),
      },
      {
        path: 'profesores',
        title: 'Profesores · Cursillo',
        loadComponent: () =>
          import('./features/profesores/profesores-page').then((m) => m.ProfesoresPage),
      },
    ],
  },
  { path: '**', redirectTo: 'grupos' },
];
