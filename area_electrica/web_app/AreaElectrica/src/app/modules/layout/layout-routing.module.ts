import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { ProfileComponent } from '../profile/profile.component';
import { SettingsComponent } from '../settings/settings.component';
import { authGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        component: LayoutComponent,
        loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'components',
        component: LayoutComponent,
        loadChildren: () => import('../uikit/uikit.module').then((m) => m.UikitModule),
      },
      {
        path: 'admin',
        component: LayoutComponent,
        loadChildren: () => import('../admin/admin.module').then((m) => m.AdminModule),
      },
      {
        path: 'orden',
        component: LayoutComponent,
        loadChildren: () => import('../orden/orden.module').then((m) => m.OrdenModule),
      },
      {
        path: 'reportes',
        component: LayoutComponent,
        loadChildren: () => import('../reportes/reportes.module').then((m) => m.ReportesModule),
      },
      {
        path: 'profile',
        component: LayoutComponent,
        children: [{ path: '', component: ProfileComponent }],
      },
      {
        path: 'settings',
        component: LayoutComponent,
        children: [{ path: '', component: SettingsComponent }],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: '**', redirectTo: 'error/404' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule { }
