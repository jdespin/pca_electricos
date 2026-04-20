import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ServiciosWebProceso } from '../../../../services/ServiciosWebProceso.service';
import { PdfExportService } from '../../../../services/pdf-export.service';

@Component({
  selector: 'app-formularios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formularios.component.html',
  styleUrl: './formularios.component.css',
})
export class FormulariosComponent implements OnInit {
  ordenes: any[] = [];
  cargando = false;
  filtro = '';
  estadoFiltro = '';

  readonly estados: Record<string, { label: string; clases: string }> = {
    proceso:    { label: 'En proceso', clases: 'bg-yellow-100 text-yellow-800' },
    finalizada: { label: 'Finalizada',  clases: 'bg-green-100 text-green-800'  },
    evaluada:   { label: 'Evaluada',    clases: 'bg-blue-100 text-blue-800'    },
  };
  readonly estadosLista = [
    { value: 'proceso',    label: 'En proceso', activeCls: 'bg-yellow-50 border-yellow-400 text-yellow-800', dotCls: 'bg-yellow-400' },
    { value: 'finalizada', label: 'Finalizada',  activeCls: 'bg-green-50 border-green-400 text-green-800',   dotCls: 'bg-green-500'  },
    { value: 'evaluada',   label: 'Evaluada',    activeCls: 'bg-blue-50 border-blue-400 text-blue-800',     dotCls: 'bg-blue-500'   },
  ];
  readonly tipoLabels: Record<string, string> = {
    inspeccion:    'Inspección',
    mantenimiento: 'Mantenimiento',
    instalacion:   'Instalación',
  };
  readonly tipoEquipoLabels: Record<string, string> = {
    SUT:   'Subestación (SUT)',
    SDT:   'Sistema de Transf. (SDT)',
    VSD:   'Variador (VSD)',
    CHOKE: 'Choke / Reactancia',
    JB:    'Junction Box (JB)',
  };
  readonly tabsFiltro = [
    { value: '',           label: 'Todas'      },
    { value: 'proceso',    label: 'En proceso' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'evaluada',   label: 'Evaluada'   },
  ];

  // Modal info de la orden
  ordenDetalle: any | null = null;
  cargandoDetalle = false;

  // Modal cambiar estado
  ordenEstado: any | null = null;
  cambiandoEstado = false;

  // Modal eliminar
  ordenEliminar: any | null = null;
  eliminando = false;

  // Modal reporte técnico
  reporteTecnico: any | null = null;
  cargandoReporte = false;
  tabReporte: 'reporte' | 'equipos' = 'reporte';
  fotosCache = new Map<number, string>();
  cargandoFotos = false;
  fotoAmpliada: string | null = null;

  constructor(
    private router: Router,
    private procesoSrv: ServiciosWebProceso,
    private cdr: ChangeDetectorRef,
    private pdfSrv: PdfExportService,
  ) {}

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (!document.hidden) this.cargarOrdenes();
  }

  ngOnInit(): void { this.cargarOrdenes(); }

  cargarOrdenes(): void {
    this.cargando = true;
    this.procesoSrv.ListarOrdenes().subscribe({
      next: (resp: any) => {
        this.ordenes  = resp.datos ?? [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

  get ordenesFiltradas(): any[] {
    let lista = this.estadoFiltro
      ? this.ordenes.filter(o => o.strestado === this.estadoFiltro)
      : this.ordenes;
    const f = (this.filtro || '').trim().toLowerCase();
    if (!f) return lista;
    return lista.filter(o =>
      (o.strcontrato || '').toLowerCase().includes(f) ||
      (o.strproyecto || '').toLowerCase().includes(f) ||
      (o.strlocacion || '').toLowerCase().includes(f) ||
      (o.strregistro || '').toLowerCase().includes(f) ||
      (o.strtipo     || '').toLowerCase().includes(f)
    );
  }

  seleccionarTab(valor: string): void { this.estadoFiltro = valor; }
  estadoClases(e: string): string { return this.estados[e]?.clases ?? 'bg-gray-100 text-gray-800'; }
  estadoLabel(e: string):  string { return this.estados[e]?.label  ?? e; }
  tipoLabel(t: string):    string { return this.tipoLabels[t]      ?? t; }
  tipoEquipoLabel(t: string): string { return this.tipoEquipoLabels[t] ?? t; }
  nuevaOrden(): void { this.router.navigate(['/orden/nuevo']); }

  // ── Detalle básico de la orden ────────────────────────────────────────────
  verDetalle(o: any): void {
    this.ordenDetalle    = { ...o };
    this.cargandoDetalle = true;
    this.procesoSrv.DetalleOrden(o.idorden).subscribe({
      next: (resp: any) => {
        if (resp?.success) this.ordenDetalle = resp.dato;
        this.cargandoDetalle = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoDetalle = false; },
    });
  }
  cerrarDetalle(): void { this.ordenDetalle = null; }

  // ── Reporte técnico (texto + fotos) ──────────────────────────────────────
  verReporteTecnico(o: any): void {
    this.reporteTecnico  = { ...o, reportesOrden: [], reportesEquipo: [], fotosEquipo: [] };
    this.cargandoReporte = true;
    this.tabReporte      = 'reporte';
    this.fotoAmpliada    = null;
    this.fotosCache      = new Map();

    this.procesoSrv.DetalleReporteTecnico(o.idorden).subscribe({
      next: (r: any) => {
        if (r?.success) {
          this.reporteTecnico = r.dato;
          this._cargarFotos(r.dato?.fotosEquipo ?? []);
        }
        this.cargandoReporte = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoReporte = false; this.cdr.detectChanges(); },
    });
  }

  private _cargarFotos(fotos: any[]): void {
    if (!fotos.length) return;
    this.cargandoFotos = true;
    const peticiones = fotos.map(f =>
      this.procesoSrv.FotoEquipo(f.idfotoequipo).pipe(
        map((r: any) => ({ id: f.idfotoequipo, src: r?.success ? `data:${r.mimetype};base64,${r.base64}` : null })),
        catchError(() => of({ id: f.idfotoequipo, src: null })),
      )
    );
    forkJoin(peticiones).subscribe(resultados => {
      for (const { id, src } of resultados) {
        if (src) this.fotosCache.set(id, src);
      }
      this.cargandoFotos = false;
      this.cdr.detectChanges();
    });
  }

  cerrarReporteTecnico(): void {
    this.reporteTecnico = null;
    this.fotoAmpliada   = null;
    this.fotosCache     = new Map();
  }

  get equiposConFotos(): { reporte: any; fotos: any[] }[] {
    if (!this.reporteTecnico) return [];
    const todasFotos: any[] = this.reporteTecnico.fotosEquipo ?? [];
    return (this.reporteTecnico.reportesEquipo ?? []).map((eq: any) => ({
      reporte: eq,
      fotos:   todasFotos.filter(f => f.strtipoequipo === eq.strtipoequipo),
    }));
  }

  fotoSrc(id: number): string | null { return this.fotosCache.get(id) ?? null; }
  fotosConGps(fotos: any[]): any[]   { return fotos.filter(f => f.dbllatitud); }
  ampliarFoto(id: number): void      { const s = this.fotosCache.get(id); if (s) this.fotoAmpliada = s; }
  cerrarFoto(): void                 { this.fotoAmpliada = null; }

  // ── Cambiar estado ───────────────────────────────────────────────────────
  abrirCambioEstado(o: any): void  { this.ordenEstado = { ...o, nuevoEstado: o.strestado }; }
  cerrarCambioEstado(): void       { this.ordenEstado = null; }
  confirmarCambioEstado(): void {
    if (!this.ordenEstado) return;
    this.cambiandoEstado = true;
    this.procesoSrv.CambiarEstadoOrden(this.ordenEstado.idorden, this.ordenEstado.nuevoEstado).subscribe({
      next: () => { this.cambiandoEstado = false; this.ordenEstado = null; this.cargarOrdenes(); },
      error: () => { this.cambiandoEstado = false; },
    });
  }

  // ── Modificar ────────────────────────────────────────────────────────────
  modificar(o: any): void {
    this.router.navigate(['/orden/nueva', o.strtipo], { queryParams: { idorden: o.idorden } });
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────
  abrirEliminar(o: any): void  { this.ordenEliminar = o; }
  cerrarEliminar(): void       { this.ordenEliminar = null; }
  confirmarEliminar(): void {
    if (!this.ordenEliminar) return;
    this.eliminando = true;
    this.procesoSrv.EliminarOrden(this.ordenEliminar.idorden).subscribe({
      next: () => { this.eliminando = false; this.ordenEliminar = null; this.cargarOrdenes(); },
      error: () => { this.eliminando = false; },
    });
  }

  // ── Exportar PDF ─────────────────────────────────────────────────────────
  exportarLista(): void        { this.pdfSrv.exportarLista(this.ordenesFiltradas, this.estadoFiltro, this.filtro); }
  exportarDetalle(o: any): void { this.pdfSrv.exportarDetalle(o); }
}
