import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosWebCentral } from '../../../../services/ServiciosWebCentral.service';
import { ServiciosWebProceso } from '../../../../services/ServiciosWebProceso.service';

export interface Equipo {
  id: string;
  label: string;
  seleccionado: boolean;
}

export interface Tecnico {
  id: number;
  idusuario: number | null;
  nombre: string;
  usuario: string;
  seleccionado: boolean;
  esLider: boolean;
}

@Component({
  selector: 'app-nueva-orden-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-orden-form.component.html',
  styleUrl: './nueva-orden-form.component.css',
})
export class NuevaOrdenFormComponent implements OnInit {

  tipo = '';

  readonly tipoConfig: Record<string, { label: string; headerColor: string; badge: string }> = {
    inspeccion:    { label: 'Inspección',    headerColor: 'bg-blue-700',   badge: 'bg-blue-100 text-blue-700'    },
    mantenimiento: { label: 'Mantenimiento', headerColor: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
    instalacion:   { label: 'Instalación',   headerColor: 'bg-green-700',  badge: 'bg-green-100 text-green-700'  },
  };

  equipos: Equipo[] = [
    { id: 'sut',   label: 'SUT',   seleccionado: false },
    { id: 'sdt',   label: 'SDT',   seleccionado: false },
    { id: 'vsd',   label: 'VSD',   seleccionado: false },
    { id: 'choke', label: 'Choke', seleccionado: false },
    { id: 'jb',    label: 'JB',    seleccionado: false },
  ];

  tecnicos: Tecnico[] = [];

  datosGenerales = {
    strcontratista: '', strsubcontratista: '', strterminado: '',
    strsitio: '', strordencompra: '', dtfecha: '',
  };

  datosSUT = {
    strserie: '', strvolprimario: '', strvolsecundario: '',
    strpotencia: '', strtemperatura: '', strobservaciones: '',
  };

  datosSDT = {
    strserie: '', strvolentrada: '', strvol_salida: '',
    strrelacion: '', strobservaciones: '',
  };

  datosVSD = {
    strserie: '', strpotencia: '', strvolentrada: '',
    strfrecuencia: '', strobservaciones: '',
  };

  datosChoke = {
    strtipo: '', strtamano: '', strpresion: '',
    strmaterial: '', strobservaciones: '',
  };

  datosJB = {
    strserie: '', strvoltaje: '', strterminales: '',
    strcalibre: '', strobservaciones: '',
  };

  mensajeEstado = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  guardando = false;
  idorden: number | null = null;
  modoEdicion = false;
  private _pendingPersonal: any[] = [];

  get tipoInfo() {
    return this.tipoConfig[this.tipo] ?? this.tipoConfig['inspeccion'];
  }

  get tituloReporte(): string {
    return `REPORTE DE ${this.tipoInfo.label.toUpperCase()} QA/QC-B61-2018`;
  }

  get labelSitio(): string {
    const t = this.tipoInfo.label;
    return `Sitio de ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
  }

  get labelFecha(): string {
    const t = this.tipoInfo.label;
    return `Fecha de ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
  }

  get equiposSeleccionados(): string[] {
    return this.equipos.filter(e => e.seleccionado).map(e => e.id);
  }

  get tecnicosSeleccionados(): Tecnico[] {
    return this.tecnicos.filter(t => t.seleccionado);
  }

  get lider(): Tecnico | undefined {
    return this.tecnicos.find(t => t.seleccionado && t.esLider);
  }

  estaSeleccionado(id: string): boolean {
    return this.equipos.find(e => e.id === id)?.seleccionado ?? false;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private centralService: ServiciosWebCentral,
    private procesoService: ServiciosWebProceso,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.tipo = this.route.snapshot.paramMap.get('tipo') ?? 'inspeccion';
    const idordenParam = this.route.snapshot.queryParamMap.get('idorden');
    if (idordenParam) {
      this.idorden = Number(idordenParam);
      this.modoEdicion = true;
      this.cargarOrdenExistente(this.idorden);
    }
    this.cargarTecnicos();
  }

  cargarTecnicos(): void {
    this.centralService.ListadoPersonaTodos().subscribe({
      next: (resp: any) => {
        if (resp?.success && Array.isArray(resp.datos)) {
          this.tecnicos = resp.datos.map((p: any) => ({
            id: p.idpersona ?? p.ouidpersona,
            idusuario: p.idusuario ?? null,
            nombre: `${p.strnombres ?? ''} ${p.strapellidos ?? ''}`.trim(),
            usuario: p.strcedula ?? '',
            seleccionado: false,
            esLider: false,
          }));
          if (this._pendingPersonal.length) {
            for (const pp of this._pendingPersonal) {
              const t = this.tecnicos.find(t => t.idusuario === pp.idusuario);
              if (t) { t.seleccionado = true; t.esLider = pp.boolider; }
            }
            this._pendingPersonal = [];
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {},
    });
  }

  cargarOrdenExistente(idorden: number): void {
    this.procesoService.DetalleOrden(idorden).subscribe({
      next: (resp: any) => {
        if (resp?.success && resp.dato) {
          const o = resp.dato;
          this.datosGenerales = {
            strcontratista: o.strcontratista ?? '',
            strsubcontratista: o.strsubcontratista ?? '',
            strterminado: o.strterminado ?? '',
            strsitio: o.strsitio ?? '',
            strordencompra: o.strordencompra ?? '',
            dtfecha: o.dtfecha ? (o.dtfecha as string).substring(0, 10) : '',
          };
          this._pendingPersonal = o.personal ?? [];
          if (this.tecnicos.length) {
            for (const pp of this._pendingPersonal) {
              const t = this.tecnicos.find(t => t.idusuario === pp.idusuario);
              if (t) { t.seleccionado = true; t.esLider = pp.boolider; }
            }
            this._pendingPersonal = [];
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {},
    });
  }

  toggleEquipo(equipo: Equipo): void {
    equipo.seleccionado = !equipo.seleccionado;
    this.mensajeEstado = '';
  }

  toggleTecnico(tecnico: Tecnico): void {
    tecnico.seleccionado = !tecnico.seleccionado;
    if (!tecnico.seleccionado) {
      tecnico.esLider = false;
      if (!this.lider && this.tecnicosSeleccionados.length > 0) {
        this.tecnicosSeleccionados[0].esLider = true;
      }
    } else if (this.tecnicosSeleccionados.length === 1) {
      tecnico.esLider = true;
    }
    this.mensajeEstado = '';
  }

  setLider(tecnico: Tecnico): void {
    this.tecnicos.forEach(t => t.esLider = false);
    tecnico.esLider = true;
  }

  volver(): void {
    this.router.navigate([this.modoEdicion ? '/orden/todas' : '/orden/nueva']);
  }

  guardar(): void {
    this.mensajeEstado = '';
    this.tipoMensaje = '';

    if (this.tecnicosSeleccionados.length === 0) {
      this.mensajeEstado = 'Debe asignar al menos un técnico a la orden.';
      this.tipoMensaje = 'error';
      return;
    }
    if (!this.lider) {
      this.mensajeEstado = 'Debe designar un líder para el grupo.';
      this.tipoMensaje = 'error';
      return;
    }

    const personal = this.tecnicosSeleccionados
      .filter(t => t.idusuario != null)
      .map(t => ({ idusuario: t.idusuario, boolider: t.esLider }));

    if (personal.length === 0) {
      this.mensajeEstado = 'Los técnicos seleccionados no tienen usuario registrado en el sistema.';
      this.tipoMensaje = 'error';
      return;
    }

    const idusuariocreador = Number(localStorage.getItem('idUsuario')) || null;

    const objOrden = {
      strtipo: this.tipo,
      ...this.datosGenerales,
      idusuariocreador,
      personal,
    };

    this.guardando = true;
    const obs = this.modoEdicion && this.idorden
      ? this.procesoService.ActualizarOrden(this.idorden, objOrden)
      : this.procesoService.CrearOrden(objOrden);

    obs.subscribe({
      next: (resp: any) => {
        this.guardando = false;
        if (resp?.success) {
          this.mensajeEstado = this.modoEdicion
            ? `Orden #${this.idorden} actualizada correctamente.`
            : `Orden #${resp.idorden} creada. Notificaciones enviadas al equipo.`;
          this.tipoMensaje = 'success';
          setTimeout(() => this.router.navigate(['/orden/todas']), 2000);
        } else {
          this.mensajeEstado = resp?.mensaje ?? 'Error al guardar la orden.';
          this.tipoMensaje = 'error';
        }
      },
      error: () => {
        this.guardando = false;
        this.mensajeEstado = 'Error de conexión al guardar la orden.';
        this.tipoMensaje = 'error';
      },
    });
  }
}
