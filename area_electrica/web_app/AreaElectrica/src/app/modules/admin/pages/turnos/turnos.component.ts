import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosWebCentral } from '../../../../services/ServiciosWebCentral.service';

const DIAS_KEYS = ['bllunes','blmartes','blmiercoles','bljueves','blviernes','blsabado','bldomingo'] as const;
const DIAS_LABELS: Record<string, string> = {
  bllunes: 'Lun', blmartes: 'Mar', blmiercoles: 'Mié',
  bljueves: 'Jue', blviernes: 'Vie', blsabado: 'Sáb', bldomingo: 'Dom'
};

function turnoVacio() {
  return {
    idturno: null,
    strturno: '', strdescripcion: '', strhorainicio: '', strhorafin: '',
    bllunes: false, blmartes: false, blmiercoles: false,
    bljueves: false, blviernes: false, blsabado: false, bldomingo: false,
    blestado: true
  };
}

@Component({
  selector: 'app-turnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './turnos.component.html',
  styleUrl: './turnos.component.css',
})
export class TurnosComponent implements OnInit {
  turnos: any[] = [];
  cargando = false;
  filtro = '';

  modalAbierto = false;
  modalModo: 'crear' | 'editar' = 'crear';
  objTurno: any = turnoVacio();

  diasKeys = DIAS_KEYS;
  diasLabels = DIAS_LABELS;

  constructor(
    private centralSrv: ServiciosWebCentral,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarTurnos();
  }

  cargarTurnos(): void {
    this.cargando = true;
    this.centralSrv.ListadoTurnoTodos().subscribe({
      next: (resp: any) => {
        this.turnos = resp?.datos ?? [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.turnos = [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  get turnosFiltrados(): any[] {
    const term = (this.filtro ?? '').trim().toLowerCase();
    if (!term) return this.turnos;
    return this.turnos.filter(t =>
      (t.strturno ?? '').toLowerCase().includes(term)
    );
  }

  abrirModalCrear(): void {
    this.objTurno = turnoVacio();
    this.modalModo = 'crear';
    this.modalAbierto = true;
  }

  editarTurno(t: any): void {
    this.objTurno = { ...t };
    this.modalModo = 'editar';
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  guardarTurno(): void {
    if (!this.objTurno.strturno?.trim()) return;

    const obs = this.modalModo === 'crear'
      ? this.centralSrv.CrearTurno(this.objTurno)
      : this.centralSrv.ActualizarTurno(this.objTurno);

    obs.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarTurnos();
      },
      error: (err: any) => console.error('Error al guardar turno:', err),
    });
  }

  toggleEstado(t: any): void {
    const nuevoEstado = !t.blestado;
    t.blestado = nuevoEstado;
    this.cdr.detectChanges();
    this.centralSrv.ActualizarTurnoEstado(t.idturno, nuevoEstado).subscribe({
      error: () => {
        t.blestado = !nuevoEstado;
        this.cdr.detectChanges();
      },
    });
  }

  diasLabel(t: any): string {
    return DIAS_KEYS
      .filter(k => t[k])
      .map(k => DIAS_LABELS[k])
      .join(', ') || '—';
  }
}
