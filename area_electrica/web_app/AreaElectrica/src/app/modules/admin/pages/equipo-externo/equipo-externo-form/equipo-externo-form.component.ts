import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ServiciosWebProceso } from '../../../../../services/ServiciosWebProceso.service';


interface TipoPrueba {
  idtipoequipo: number;
  strnombre: string;
}

@Component({
  selector: 'app-equipo-externo-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './equipo-externo-form.component.html',
  styleUrl: './equipo-externo-form.component.css',
})

export class EquipoExternoFormComponent implements OnInit {
  listaTipoEquipo: TipoPrueba[] = [];
  listaAnios: number[] = [];

  cargando = false;
  disableGuardar = false;

  mensajeEstado = '';
  tipoMensajeEstado: 'success' | 'error' | null = null;

  objEquipo: any = {
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
  };

  identificadorExiste = false;
  verificandoIdentificador = false;
  timerIdentificador: any = null;

  constructor(
    private procesoSrv: ServiciosWebProceso,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.listaAnios = this.generarListaAnios(1980);
    this.cargarTipoEquipo();
  }

  cargarTipoEquipo(): void {
    this.cargando = true;

    this.procesoSrv.ListadoTipoEquipoActivo().subscribe({
      next: (resp: any) => {
        this.listaTipoEquipo = resp?.datos ?? [];
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error ListadoTipoEquipoActivo:', err);
        this.listaTipoEquipo = [];
        this.cargando = false;
        this.setMensaje('No se pudo cargar la lista de tipos de equipo.', 'error');
      },
    });
  }


  onIdentificadorChange(valor: string): void {
    this.identificadorExiste = false;

    if (this.timerIdentificador) {
      clearTimeout(this.timerIdentificador);
    }

    const stridentificador = (valor || '').trim();

    if (!stridentificador) {
      this.verificandoIdentificador = false;
      return;
    }

    this.verificandoIdentificador = true;

    this.timerIdentificador = setTimeout(() => {
      this.verificarIdentificador(stridentificador);
    }, 500);
  }

verificarIdentificador(identificador: string): void {
  this.procesoSrv.VerificarIdentificadorEquipoExterno(identificador).subscribe({
    next: (resp: any) => {
      console.log('Respuesta verificación stridentificador:', resp);

      this.verificandoIdentificador = false;

      const existe = resp?.datos?.existe === true;

      this.identificadorExiste = existe;

      if (existe) {
        this.setMensaje('El identificador ya está registrado.', 'error');
      } else if (
        this.tipoMensajeEstado === 'error' &&
        this.mensajeEstado === 'El identificador ya está registrado.'
      ) {
        this.setMensaje('', null);
      }
    },
    error: (err: any) => {
      console.error('Error al verificar identificador:', err);
      this.verificandoIdentificador = false;
      this.identificadorExiste = false;
    },
  });
}

  guardarEquipo(): void {
    this.mensajeEstado = '';
    this.tipoMensajeEstado = null;

    if (!this.validarFormulario()) {
      return;
    }

    this.disableGuardar = true;

    const payload = {
      ...this.objEquipo,
      idtipoequipo: this.convertirANumero(this.objEquipo.idtipoequipo),
      intanio: this.convertirANumero(this.objEquipo.intanio),
    };

    console.log('Payload a enviar:', payload);

    this.procesoSrv.IngresarEquipoExterno(payload).subscribe({
      next: (resp: any) => {
        this.disableGuardar = false;

        if (resp?.success === false) {
          this.setMensaje(resp?.mensaje || 'No se pudo guardar el equipo.', 'error');
          return;
        }

        this.setMensaje(resp?.mensaje || 'Equipo registrado correctamente.', 'success');

        setTimeout(() => {
          this.router.navigate(['/admin/equipo_externo']);
        }, 700);
      },
      error: (err: any) => {
        console.error('Error IngresarEquipoExterno:', err);
        this.disableGuardar = false;

        this.setMensaje(
          err?.error?.mensaje || 'Ocurrió un error al guardar la información.',
          'error'
        );
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/equipo_externo']);
  }

  validarFormulario(): boolean {
    if (!this.objEquipo.idtipoequipo) {
      this.setMensaje('Debe seleccionar el tipo de equipo.', 'error');
      return false;
    }

    if (!this.objEquipo.stridentificador?.trim()) {
      this.setMensaje('Debe ingresar el stridentificador.', 'error');
      return false;
    }

    if (!this.objEquipo.strserie?.trim()) {
      this.setMensaje('Debe ingresar la serie.', 'error');
      return false;
    }

    if (!this.objEquipo.strequipo?.trim()) {
      this.setMensaje('Debe ingresar el nombre del equipo.', 'error');
      return false;
    }

    if (!this.objEquipo.intanio) {
      this.setMensaje('Debe seleccionar el año.', 'error');
      return false;
    }

    return true;
  }

  generarListaAnios(anioMinimo: number): number[] {
    const anioActual = new Date().getFullYear();
    const anios: number[] = [];

    for (let intanio = anioActual; intanio >= anioMinimo; intanio--) {
      anios.push(intanio);
    }

    return anios;
  }

  convertirANumero(valor: any): number | null {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    const numero = Number(valor);
    return isNaN(numero) ? null : numero;
  }

setMensaje(mensaje: string, tipo: 'success' | 'error' | null): void {
  this.mensajeEstado = mensaje;
  this.tipoMensajeEstado = tipo;
}
}
