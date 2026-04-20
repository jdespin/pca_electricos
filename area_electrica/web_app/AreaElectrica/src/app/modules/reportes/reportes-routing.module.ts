import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReportesComponent } from './reportes.component';
import { UsoEquipoComponent } from './pages/uso-equipo/uso-equipo.component';

const routes: Routes = [
  {
    path: '',
    component: ReportesComponent,
    children: [
      { path: '',           redirectTo: 'uso-equipo', pathMatch: 'full' },
      { path: 'uso-equipo', component: UsoEquipoComponent },
      { path: '**',         redirectTo: 'uso-equipo' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReportesRoutingModule {}
