import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { UserComponent } from './pages/user/user.component';
import { RolComponent } from './pages/rol/rol.component';
import { PersonalComponent } from './pages/personal/personal.component';
import { EquipoInternoComponent } from './pages/equipo-interno/equipo-interno.component';
import { EquipoExternoComponent } from './pages/equipo-externo/equipo-externo.component';
import { EquipoExternoFormComponent } from './pages/equipo-externo/equipo-externo-form/equipo-externo-form.component';
import { FormulariosComponent } from './pages/formularios/formularios.component';
import { ReportesTecnicosComponent } from './pages/reportes-tecnicos/reportes-tecnicos.component';
import { TecnicosComponent } from './pages/tecnicos/tecnicos.component';
import { TurnosComponent } from './pages/turnos/turnos.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: '', redirectTo: 'personal', pathMatch: 'full' },
      { path: 'personal',        component: PersonalComponent        },
      { path: 'tecnicos',       component: TecnicosComponent       },
      { path: 'turnos',         component: TurnosComponent         },
      { path: 'user',           component: UserComponent           },
      { path: 'rol',            component: RolComponent            },
      { path: 'formularios',        component: FormulariosComponent       },
      { path: 'reportes-tecnicos',  component: ReportesTecnicosComponent  },
      { path: 'equipo_interno',      component: EquipoInternoComponent },
      { path: 'equipos',             component: EquipoInternoComponent },
      { path: 'equipos/:categoria',  component: EquipoInternoComponent },

      {
        path: 'equipo_externo',
        children: [
          { path: '', component: EquipoExternoComponent },
          { path: 'nuevo', component: EquipoExternoFormComponent },
        ],
      },

      { path: '**', redirectTo: 'personal' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule { }
