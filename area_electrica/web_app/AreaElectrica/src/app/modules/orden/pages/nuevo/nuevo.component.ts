import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosWebProceso } from '../../../../services/ServiciosWebProceso.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-nuevo',
  imports: [CommonModule, FormsModule],
  templateUrl: './nuevo.component.html',
  styleUrl: './nuevo.component.css',
})
export class NuevoComponent implements OnInit {


  listaEquiposExternosActivos: any[] = [];

  objOrden: any = {
    strcontrato: '',
    strproyecto: '',
    strregistro: '',
    strcontratista: '',
    strlocacion: '',
    strot: '',
    strdisciplina: '',
    strpozo: '',
    dtfecha: null,
  };

  objEquipo: any = {
    idequipoint: null,
    idtipoprueba: null,
    strequipo: '',
    strserie: '',
    strmarca: '',
    strmodelo: '',
    strdescripcion: '',
    iddisponibilidad: null,
  };


  disableGuardar = false;

  mensajeEstado = '';
  tipoMensajeEstado: 'success' | 'error' | '' = '';

  mostrarFormularioSerie = false;

  mensajeSerieEquipo = '';
  tipoMensajeSerieEquipo: 'success' | 'error' | '' = '';

  listaEquiposMedicion: any[] = [];
  listaEquiposMedicionFiltrada: any[] = [];

  listaSerieEquipos: any[] = [];

  objSerieEquipo: any = this.crearObjetoSerieEquipoVacio();

  listaTipoPrueba: any[] = [];



  busquedaEquipo = '';
  buscandoEquipo = false;

  cargando = false;




  objFirmas = {
  realizadoNombre: '',
  realizadoCargo: '',
  realizadoFirma: '',
  realizadoFecha: '',

  revisadoNombre: '',
  revisadoCargo: '',
  revisadoFirma: '',
  revisadoFecha: '',

  supervisadoNombre: '',
  supervisadoCargo: '',
  supervisadoFirma: '',
  supervisadoFecha: '',

  aprobadoNombre: '',
  aprobadoCargo: '',
  aprobadoFirma: '',
  aprobadoFecha: '',
};

objEncargadoTrabajo = {
  idempleado: null,
  strnombres: '',
  strapellidos: '',
  strcedula: '',
  strcelular: '',
};

listaEmpleados: any[] = [];


  constructor(
    private procesoSrv: ServiciosWebProceso,
    private router: Router,
    private cdRef: ChangeDetectorRef

  ) { }



  ngOnInit(): void {

  }

  filtroEquipo = {
    tipoBusqueda: 'identificador',
    valor: ''
  };

  mensajeBusquedaEquipo = '';
  tipoMensajeBusquedaEquipo: 'success' | 'error' | '' = '';


  buscarEquipoExterno(): void {
    const termino = (this.busquedaEquipo || '').trim();

    if (!termino) {
      this.limpiarEquipoSeleccionado();
      return;
    }

    this.buscandoEquipo = true;

    this.procesoSrv.EquipoExternoIdentificador(termino).subscribe({
      next: (resp: any) => {
        this.buscandoEquipo = false;

        const lista = resp?.datos ?? [];
        const equipo = Array.isArray(lista) && lista.length > 0 ? lista[0] : null;

        if (equipo) {
          this.objEquipo = {
            ...equipo
          };
        } else {
          this.limpiarEquipoSeleccionado();
        }

        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al buscar equipo externo:', err);
        this.buscandoEquipo = false;
        this.limpiarEquipoSeleccionado();
        this.cdRef.detectChanges();
      },
    });
  }

  limpiarEquipoSeleccionado(): void {
    this.objEquipo = {
      idtipoequipo: null,
      stridentificador: '',
      strserie: '',
      strconexion: '',
      strtipoclase: '',
      strplanoreferencia: '',
      strfabricante: '',
      strvoltajemegger: '',
      strequipo: '',
      strat: '',
      strbt: '',
      strcapacidad: '',
      strtipofluido: '',
      strpesoaceite: '',
      strpesototal: '',
      intanio: null,
      strubicacion: '',
      strtipoequipo: ''
    };
  }


  private setCargando(valor: boolean): void {
    this.cargando = valor;
    this.cdRef.detectChanges();
  }
  listaTipoPruebaActivos(): void {
    this.setCargando(true);
    this.procesoSrv.ListadoTiposPruebaActivos().subscribe({
      next: (resp: any) => {
        this.listaTipoPrueba = resp?.datos ?? [];
        this.setCargando(false);
      },
      error: (err: any) => {
        console.error('Error ListadoTiposPruebaActivos:', err);
        this.listaTipoPrueba = [];
        this.setCargando(false);
      },
    });
  }

crearObjetoSerieEquipoVacio() {
  return {
    idtipoprueba: null,
    idequipointerno: null,
    strprueba: '',
    strequipo: '',
    strserie: '',
    strmarca: '',
    strmodelo: '',
    strdescripcion: '',
    strdisponibilidad: ''
  };
}

abrirFormularioSerie(): void {
  this.mostrarFormularioSerie = !this.mostrarFormularioSerie;

  if (this.mostrarFormularioSerie) {
    this.mensajeSerieEquipo = '';
    this.tipoMensajeSerieEquipo = '';
    this.objSerieEquipo = this.crearObjetoSerieEquipoVacio();
    this.listaEquiposMedicionFiltrada = [];
    this.listaTipoPruebaActivos();
  }
}

listaEquipoInternoPorPrueba(idtipoprueba: number): void {
  if (!idtipoprueba) {
    this.listaEquiposMedicionFiltrada = [];
    return;
  }

  this.setCargando(true);

  this.procesoSrv.EquipoInternoPorPrueba(idtipoprueba).subscribe({
    next: (resp: any) => {
      this.listaEquiposMedicionFiltrada = resp?.datos ?? [];
      this.setCargando(false);
      console.log('Equipos de medición filtrados:', this.listaEquiposMedicionFiltrada);
    },
    error: (err: any) => {
      console.error('Error EquipoInternoPorPrueba:', err);
      this.listaEquiposMedicionFiltrada = [];
      this.setCargando(false);
    },
  });
}


onTipoPruebaChange(): void {
  const idtipoprueba = Number(this.objSerieEquipo.idtipoprueba);

  this.objSerieEquipo.idequipointerno = null;
  this.objSerieEquipo.strequipo = '';
  this.objSerieEquipo.strserie = '';
  this.objSerieEquipo.strmarca = '';
  this.objSerieEquipo.strmodelo = '';
  this.objSerieEquipo.strdescripcion = '';
  this.objSerieEquipo.strdisponibilidad = '';

  const tipoSeleccionado = this.listaTipoPrueba.find(
    (item: any) => Number(item.idtipoprueba) === idtipoprueba
  );

  this.objSerieEquipo.strprueba = tipoSeleccionado?.strprueba ?? '';

  if (!idtipoprueba) {
    this.listaEquiposMedicionFiltrada = [];
    return;
  }

  this.listaEquipoInternoPorPrueba(idtipoprueba);
}

onEquipoMedicionChange(): void {
  const idequipointerno = Number(this.objSerieEquipo.idequipointerno);

  const equipoSeleccionado = this.listaEquiposMedicionFiltrada.find(
    (item: any) => Number(item.idequipointerno) === idequipointerno
  );

  if (!equipoSeleccionado) {
    this.objSerieEquipo.strequipo = '';
    this.objSerieEquipo.strserie = '';
    this.objSerieEquipo.strmarca = '';
    this.objSerieEquipo.strmodelo = '';
    this.objSerieEquipo.strdescripcion = '';
    this.objSerieEquipo.strdisponibilidad = '';
    return;
  }

  this.objSerieEquipo.strequipo = equipoSeleccionado.strequipo ?? '';
  this.objSerieEquipo.strserie = equipoSeleccionado.strserie ?? '';
  this.objSerieEquipo.strmarca = equipoSeleccionado.strmarca ?? '';
  this.objSerieEquipo.strmodelo = equipoSeleccionado.strmodelo ?? '';
  this.objSerieEquipo.strdescripcion = equipoSeleccionado.strdescripcion ?? '';
  this.objSerieEquipo.strdisponibilidad = equipoSeleccionado.strdisponibilidad ?? '';
}


agregarSerieEquipo(): void {
  this.mensajeSerieEquipo = '';
  this.tipoMensajeSerieEquipo = '';

  if (!this.objSerieEquipo.idtipoprueba) {
    this.mensajeSerieEquipo = 'Debe seleccionar un tipo de prueba.';
    this.tipoMensajeSerieEquipo = 'error';
    return;
  }

  if (!this.objSerieEquipo.idequipointerno) {
    this.mensajeSerieEquipo = 'Debe seleccionar un equipo de medición.';
    this.tipoMensajeSerieEquipo = 'error';
    return;
  }

  const yaExiste = this.listaSerieEquipos.some(
    (item: any) =>
      Number(item.idtipoprueba) === Number(this.objSerieEquipo.idtipoprueba) &&
      Number(item.idequipointerno) === Number(this.objSerieEquipo.idequipointerno)
  );

  if (yaExiste) {
    this.mensajeSerieEquipo = 'Ese tipo de prueba con ese equipo ya fue agregado.';
    this.tipoMensajeSerieEquipo = 'error';
    return;
  }

  this.listaSerieEquipos.push({
    ...this.objSerieEquipo,
  });

  this.mensajeSerieEquipo = 'Equipo de medición agregado correctamente.';
  this.tipoMensajeSerieEquipo = 'success';

  this.objSerieEquipo = this.crearObjetoSerieEquipoVacio();
  this.listaEquiposMedicionFiltrada = [];
  this.mostrarFormularioSerie = false;
}

  eliminarSerieEquipo(index: number): void {
    this.listaSerieEquipos.splice(index, 1);
  }


  limpiarSerieEquipo(): void {
    this.objSerieEquipo = this.crearObjetoSerieEquipoVacio();
    this.listaEquiposMedicionFiltrada = [];
    this.mensajeSerieEquipo = '';
    this.tipoMensajeSerieEquipo = '';
  }

  cancelar(): void {
    this.router.navigate(['/admin/equipo_externo']);
  }


  onEncargadoTrabajoChange(): void {
  const empleadoSeleccionado = this.listaEmpleados.find(
    (item: any) => Number(item.idempleado) === Number(this.objEncargadoTrabajo.idempleado)
  );

  if (!empleadoSeleccionado) {
    this.objEncargadoTrabajo.strnombres = '';
    this.objEncargadoTrabajo.strapellidos = '';
    this.objEncargadoTrabajo.strcedula = '';
    this.objEncargadoTrabajo.strcelular = '';
    return;
  }

  this.objEncargadoTrabajo.strnombres = empleadoSeleccionado.strnombres ?? '';
  this.objEncargadoTrabajo.strapellidos = empleadoSeleccionado.strapellidos ?? '';
  this.objEncargadoTrabajo.strcedula = empleadoSeleccionado.strcedula ?? '';
  this.objEncargadoTrabajo.strcelular = empleadoSeleccionado.strcelular ?? '';
}



  guardarEquipo(): void {
    this.mensajeEstado = '';
    this.tipoMensajeEstado = '';

    
    this.disableGuardar = true;


  }


}
