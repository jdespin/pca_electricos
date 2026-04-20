import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosWebCentral } from '../../../../services/ServiciosWebCentral.service';
import { ServiciosWebSeguridad } from '../../../../services/ServiciosWebSeguridad.service';

@Component({
  selector: 'app-tecnicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tecnicos.component.html',
  styleUrl: './tecnicos.component.css',
})
export class TecnicosComponent implements OnInit {
  tecnicos: any[] = [];
  cargando = false;
  filtro = '';
  
  turnoHoy: Record<number, 'TRABAJO' | 'DESCANSO'> = {};

  
  modalAbierto = false;
  objTecnico: any = {};

  
  detalleAbierto = false;
  personaDetalle: any = null;

  constructor(
    private centralSrv: ServiciosWebCentral,
    private seguridadSrv: ServiciosWebSeguridad,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarTecnicos();
  }

  
  cargarTecnicos(): void {
    this.cargando = true;
    this.seguridadSrv.ListadoUsuarioPersonaTodos().subscribe({
      next: (resp: any) => {
        const todos = resp?.datos ?? [];
        this.tecnicos = todos.filter((u: any) => this.esTecnico(u));
        this.cargando = false;
        this.cdr.detectChanges();
        this.cargarTurnoHoy();
      },
      error: () => {
        this.tecnicos = [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  private cargarTurnoHoy(): void {
    this.seguridadSrv.ObtenerTurnosTecnicosHoy().subscribe({
      next: (resp: any) => {
        const lista: any[] = resp?.datos ?? [];
        const map: Record<number, 'TRABAJO' | 'DESCANSO'> = {};
        for (const d of lista) {
          const id = Number(d.idusuario);
          if (!isNaN(id)) {
            map[id] = d.strtipo === 'DESCANSO' ? 'DESCANSO' : 'TRABAJO';
          }
        }
        this.turnoHoy = map;
        this.cdr.detectChanges();
      },
      error: () => {  },
    });
  }

  getTurnoHoy(t: any): 'TRABAJO' | 'DESCANSO' | null {
    const id = Number(t.idusuario ?? t.ouidusuario);
    return !isNaN(id) ? (this.turnoHoy[id] ?? null) : null;
  }

  private esTecnico(u: any): boolean {
    const roles: any[] = u.roles ?? [];
    return roles.some((r: any) => {
      const nombre = (r.ourol_strnombre ?? r.rol_strnombre ?? r ?? '')
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return nombre.includes('tecnico');
    });
  }

  get tecnicosFiltrados(): any[] {
    const term = (this.filtro ?? '').trim().toLowerCase();
    if (!term) return this.tecnicos;
    return this.tecnicos.filter(t =>
      (t.strnombres    ?? t.oustrnombres    ?? '').toLowerCase().includes(term) ||
      (t.strapellidos  ?? t.oustrapellidos  ?? '').toLowerCase().includes(term) ||
      (t.strcedula     ?? t.oustrcedula     ?? '').toLowerCase().includes(term)
    );
  }

  
  verDetalle(t: any): void {
    this.personaDetalle = t;
    this.detalleAbierto = true;
    this.cdr.detectChanges();
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.personaDetalle = null;
  }

  
  modalTurno        = false;
  turnoTecnico: any = null;
  
  turnoFechas: Record<string, 'TRABAJO' | 'DESCANSO'> = {};
  turnoMes: Date    = new Date();
  turnoGuardando    = false;
  turnoMensaje      = '';
  turnoError        = '';

  private readonly MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                             'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  get nombreMesTurno(): string {
    return `${this.MESES[this.turnoMes.getMonth()]} ${this.turnoMes.getFullYear()}`;
  }

  get diasCalendario(): Array<{ fecha: string; dia: number; mesActual: boolean }> {
    const año = this.turnoMes.getFullYear();
    const mes  = this.turnoMes.getMonth();
    
    const diaSemana = (new Date(año, mes, 1).getDay() + 6) % 7;
    const primerCelda = new Date(año, mes, 1 - diaSemana);
    const dias: Array<{ fecha: string; dia: number; mesActual: boolean }> = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(primerCelda);
      d.setDate(primerCelda.getDate() + i);
      dias.push({
        fecha:     this.toDateStr(d),
        dia:       d.getDate(),
        mesActual: d.getMonth() === mes && d.getFullYear() === año,
      });
    }
    return dias;
  }

  private toDateStr(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  getTipoFecha(fecha: string): 'TRABAJO' | 'DESCANSO' | null {
    return this.turnoFechas[fecha] ?? null;
  }

  toggleDiaCalendario(fecha: string, mesActual: boolean): void {
    if (!mesActual) return;
    const actual = this.turnoFechas[fecha];
    if (!actual) {
      this.turnoFechas[fecha] = 'TRABAJO';
    } else if (actual === 'TRABAJO') {
      this.turnoFechas[fecha] = 'DESCANSO';
    } else {
      delete this.turnoFechas[fecha];
    }
  }

  get totalTrabajo(): number {
    return Object.values(this.turnoFechas).filter(t => t === 'TRABAJO').length;
  }

  get totalDescanso(): number {
    return Object.values(this.turnoFechas).filter(t => t === 'DESCANSO').length;
  }

  mesAnterior(): void {
    this.turnoMes = new Date(this.turnoMes.getFullYear(), this.turnoMes.getMonth() - 1, 1);
  }

  mesSiguiente(): void {
    this.turnoMes = new Date(this.turnoMes.getFullYear(), this.turnoMes.getMonth() + 1, 1);
  }

  verTurno(t: any): void {
    this.turnoTecnico   = t;
    this.turnoFechas    = {};
    this.turnoMes       = new Date();
    this.turnoMensaje   = '';
    this.turnoError     = '';
    this.turnoGuardando = false;
    this.modalTurno     = true;
    this.cdr.detectChanges();

    const id = t.idusuario ?? t.ouidusuario;
    if (!id) return;
    this.seguridadSrv.ObtenerTurnosTecnico(id).subscribe({
      next: (resp: any) => {
        const lista: { dtfecha: string; strtipo: string }[] = resp?.datos ?? [];
        const map: Record<string, 'TRABAJO' | 'DESCANSO'> = {};
        for (const d of lista) {
          map[d.dtfecha] = (d.strtipo === 'DESCANSO' ? 'DESCANSO' : 'TRABAJO');
        }
        this.turnoFechas = map;
        this.cdr.detectChanges();
      },
    });
  }

  cerrarTurno(): void {
    this.modalTurno   = false;
    this.turnoTecnico = null;
    this.turnoFechas  = {};
  }

  guardarTurnos(): void {
    const id = this.turnoTecnico?.idusuario ?? this.turnoTecnico?.ouidusuario;
    if (!id) return;
    this.turnoGuardando = true;
    this.turnoMensaje   = '';
    this.turnoError     = '';
    const dias = Object.entries(this.turnoFechas).map(([fecha, tipo]) => ({ fecha, tipo }));
    this.seguridadSrv.GuardarTurnosTecnico(id, dias).subscribe({
      next: (resp: any) => {
        this.turnoGuardando = false;
        if (resp?.success) {
          this.turnoMensaje = resp.mensaje ?? 'Turnos guardados correctamente.';
          this.cargarTurnoHoy(); 
        } else {
          this.turnoError = resp?.error ?? 'No se pudieron guardar los turnos.';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.turnoGuardando = false;
        this.turnoError = 'Error de conexión al guardar los turnos.';
        this.cdr.detectChanges();
      },
    });
  }

  
  editar(t: any): void {
    this.objTecnico = {
      idpersona:     t.idpersona     ?? t.ouidpersona     ?? null,
      strnombres:    t.strnombres    ?? t.oustrnombres     ?? '',
      strapellidos:  t.strapellidos  ?? t.oustrapellidos   ?? '',
      strcedula:     t.strcedula     ?? t.oustrcedula      ?? '',
      strcelular1:   t.strcelular1   ?? t.oustrcelular1    ?? '',
      strcorreo1:    t.strcorreo1    ?? t.oustrcorreo1     ?? '',
      strtiposangre: t.strtiposangre ?? t.oustrtiposangre  ?? '',
    };
    this.modalAbierto = true;
    this.cdr.detectChanges();
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardar(): void {
    if (!this.objTecnico.idpersona) return;
    this.centralSrv.ActualizarPersona(this.objTecnico).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarTecnicos();
      },
      error: (err: any) => console.error('Error al actualizar:', err),
    });
  }

  
  toggleEstado(t: any): void {
    const id = t.idusuario ?? t.idpersona ?? t.ouidpersona;
    if (!id) return;

    const estadoActual = (t.usuario_blestado ?? t.blestado ?? t.ouusuario_blestado ?? t.activo) === true;
    const nuevoEstado  = !estadoActual;

    t.usuario_blestado = nuevoEstado;
    this.cdr.detectChanges();

    this.seguridadSrv.ActualizarUsuarioEstado(id, nuevoEstado).subscribe({
      next: (resp: any) => {
        if (!resp?.success) {
          t.usuario_blestado = estadoActual;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        t.usuario_blestado = estadoActual;
        this.cdr.detectChanges();
      },
    });
  }
}
