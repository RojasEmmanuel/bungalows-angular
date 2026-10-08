import { Routes } from '@angular/router';
import { NominasComponent } from './nominas/nominas.components';
import { LayoutComponent } from './layout/layout';
import { Vacaciones } from './vacaciones/vacaciones';
import { Prestamos } from './prestamos/prestamos';
import { InicioComponent } from './pages/inicio/inicio';
import { ColaboradoresComponent } from './pages/colaboradores/colaboradores';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'inicio',
        loadComponent: () => InicioComponent,
      },
      {
        path: 'colaboradores',
        loadComponent: () => ColaboradoresComponent,
      },
      {
        path: 'colaboradores/nuevo',
        loadComponent: () =>
          import('./pages/colaborador-nuevo/colaborador-nuevo').then(
            (m) => m.ColaboradorNuevoComponent
          ),
      },
      {
        path: 'colaboradores/:id',
        loadComponent: () =>
          import('./pages/colaborador-view/colaborador-view').then(
            (m) => m.ColaboradorView
          ),
      },

      {
        path: 'nominas',
        loadComponent: () => NominasComponent,
      },
      {
        path: 'vacaciones',
        loadComponent: () => Vacaciones,
      },
      {
        path:'prestamos',
        loadComponent: ()=> Prestamos
      },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];
