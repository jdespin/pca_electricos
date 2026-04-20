import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrdenComponent } from './orden.component';
import { NuevoComponent } from './pages/nuevo/nuevo.component';
import { TodasComponent } from './pages/todas/todas.component';
import { EnProcesoComponent } from './pages/en-proceso/en-proceso.component';
import { FinalizadaComponent } from './pages/finalizada/finalizada.component';
import { EvaluadaComponent } from './pages/evaluada/evaluada.component';
import { TipoOrdenComponent } from './pages/tipo-orden/tipo-orden.component';
import { NuevaOrdenFormComponent } from './pages/nueva-orden-form/nueva-orden-form.component';

const routes: Routes = [
  {
    path: '',
    component: OrdenComponent,
    children: [
      { path: '', redirectTo: 'todas', pathMatch: 'full' },
      { path: 'todas',          component: TodasComponent         },
      { path: 'en-proceso',     component: EnProcesoComponent     },
      { path: 'finalizada',     component: FinalizadaComponent    },
      { path: 'evaluada',       component: EvaluadaComponent      },
      { path: 'nuevo',          component: NuevoComponent         },
      { path: 'nueva',          component: TipoOrdenComponent     },
      { path: 'nueva/:tipo',    component: NuevaOrdenFormComponent },
      { path: 'editar/:idorden', component: NuevaOrdenFormComponent },
      { path: '**', redirectTo: 'todas' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdenRoutingModule { 




  
}
