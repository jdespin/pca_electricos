import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ServiciosWebProceso } from '../../../../services/ServiciosWebProceso.service';
import { OrdenBusquedaService } from '../../orden-busqueda.service';

@Component({
  selector: 'app-finalizada',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './finalizada.component.html',
  styleUrl: './finalizada.component.css',
})
export class FinalizadaComponent implements OnInit, OnDestroy {
  ordenes: any[] = [];
  cargando = false;

  pageSize    = 10;
  currentPage = 1;
  readonly pageSizes = [5, 10, 15];

  get ordenesVisibles(): any[] {
    const t = this.busquedaSrv.termino().toLowerCase().trim();
    if (!t) return this.ordenes;
    return this.ordenes.filter(o =>
      o.strcontratista?.toLowerCase().includes(t) ||
      o.strsubcontratista?.toLowerCase().includes(t) ||
      o.strsitio?.toLowerCase().includes(t)
    );
  }
  get paginatedOrdenes(): any[] {
    const s = (this.currentPage - 1) * this.pageSize;
    return this.ordenesVisibles.slice(s, s + this.pageSize);
  }
  get totalPages(): number { return Math.ceil(this.ordenesVisibles.length / this.pageSize) || 1; }
  get paginaInicio(): number { return this.ordenesVisibles.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1; }
  get paginaFin():    number { return Math.min(this.currentPage * this.pageSize, this.ordenesVisibles.length); }
  get paginaRango(): number[] {
    const t = this.totalPages, c = this.currentPage;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    const set = new Set<number>([1, t, c]);
    if (c > 1) set.add(c - 1);
    if (c < t) set.add(c + 1);
    return [...set].sort((a, b) => a - b);
  }
  cambiarPagina(p: number): void { if (p >= 1 && p <= this.totalPages) this.currentPage = p; }
  cambiarPageSize(s: number): void { this.pageSize = +s; this.currentPage = 1; }

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
  readonly tipoEquipoLabels: Record<string, string> = {
    SUT: 'Subestación (SUT)', SDT: 'Sistema de Transf. (SDT)',
    VSD: 'Variador (VSD)', CHOKE: 'Choke / Reactancia', JB: 'Junction Box (JB)',
  };

  private intervalo: any = null;
  private _autoOpenReporte: number | null = null;
  private _querySub: Subscription | null = null;

  ordenDetalle: any | null = null;
  cargandoDetalle = false;
  ordenEstado: any | null = null;
  cambiandoEstado = false;
  ordenEliminar: any | null = null;
  eliminando = false;

  
  ordenEvaluar: any | null = null;
  calificacionSeleccionada: 'A' | 'B' | 'C' | '' = '';
  observacionEvaluacion = '';
  evaluando = false;

  reporteTecnico: any | null = null;
  cargandoReporte = false;
  tabReporte: 'reporte' | 'equipos' = 'reporte';
  fotosCache = new Map<number, string>();
  cargandoFotos = false;
  fotoAmpliada: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private procesoSrv: ServiciosWebProceso,
    private cdr: ChangeDetectorRef,
    public busquedaSrv: OrdenBusquedaService,
  ) {
    effect(() => { this.busquedaSrv.termino(); this.currentPage = 1; });
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void { if (!document.hidden) this.cargarOrdenes(); }

  ngOnInit(): void {
    this._querySub = this.route.queryParamMap.subscribe(params => {
      const idParam = params.get('openReporte');
      if (idParam) {
        this._autoOpenReporte = Number(idParam);
        this.router.navigate([], { replaceUrl: true, queryParams: {} });
        this.cargarOrdenes();
      }
    });
    this.cargarOrdenes();
    this.intervalo = setInterval(() => this.cargarOrdenes(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.intervalo) clearInterval(this.intervalo);
    this._querySub?.unsubscribe();
  }

  cargarOrdenes(): void {
    this.cargando = true;
    this.procesoSrv.ListarOrdenes('finalizada').subscribe({
      next: (resp: any) => {
        this.ordenes = resp.datos ?? [];
        this.currentPage = 1;
        this.cargando = false;
        if (this._autoOpenReporte) {
          const id = this._autoOpenReporte;
          this._autoOpenReporte = null;
          const orden = this.ordenes.find(o => o.idorden === id);
          if (orden) {
            setTimeout(() => this.verReporteTecnico(orden), 0);
          } else {
            this.router.navigate(['/orden/evaluada'], { queryParams: { openReporte: id } });
          }
        }
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

  nuevaOrden(): void { this.router.navigate(['/orden/nuevo']); }
  estadoClases(e: string): string { return this.estados[e]?.clases ?? 'bg-gray-100 text-gray-800'; }
  estadoLabel(e: string):  string { return this.estados[e]?.label  ?? e; }
  tipoEquipoLabel(t: string): string { return this.tipoEquipoLabels[t] ?? t; }

  verDetalle(o: any): void {
    this.ordenDetalle = { ...o };
    this.cargandoDetalle = true;
    this.procesoSrv.DetalleOrden(o.idorden).subscribe({
      next: (resp: any) => { if (resp?.success) this.ordenDetalle = resp.dato; this.cargandoDetalle = false; this.cdr.detectChanges(); },
      error: () => { this.cargandoDetalle = false; },
    });
  }
  cerrarDetalle(): void { this.ordenDetalle = null; }

  verReporteTecnico(o: any): void {
    this.reporteTecnico  = { ...o, reportesOrden: [], reportesEquipo: [], fotosEquipo: [] };
    this.cargandoReporte = true;
    this.tabReporte      = 'reporte';
    this.fotoAmpliada    = null;
    this.fotosCache      = new Map();
    this.procesoSrv.DetalleReporteTecnico(o.idorden).subscribe({
      next: (r: any) => {
        if (r?.success) { this.reporteTecnico = r.dato; this._cargarFotos(r.dato?.fotosEquipo ?? []); }
        this.cargandoReporte = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoReporte = false; this.cdr.detectChanges(); },
    });
  }

  private _cargarFotos(fotos: any[]): void {
    if (!fotos.length) return;
    this.cargandoFotos = true;
    forkJoin(fotos.map(f =>
      this.procesoSrv.FotoEquipo(f.idfotoequipo).pipe(
        map((r: any) => ({ id: f.idfotoequipo, src: r?.success ? `data:${r.mimetype};base64,${r.base64}` : null })),
        catchError(() => of({ id: f.idfotoequipo, src: null })),
      )
    )).subscribe(res => {
      for (const { id, src } of res) { if (src) this.fotosCache.set(id, src); }
      this.cargandoFotos = false;
      this.cdr.detectChanges();
    });
  }

  cerrarReporteTecnico(): void { this.reporteTecnico = null; this.fotoAmpliada = null; this.fotosCache = new Map(); }

  evaluarDesdeReporte(): void {
    const orden = this.reporteTecnico;
    this.cerrarReporteTecnico();
    this.abrirEvaluar(orden);
  }

  get equiposConFotos(): { reporte: any; fotos: any[] }[] {
    if (!this.reporteTecnico) return [];
    const todas: any[] = this.reporteTecnico.fotosEquipo ?? [];
    return (this.reporteTecnico.reportesEquipo ?? []).map((eq: any) => ({
      reporte: eq, fotos: todas.filter(f => f.strtipoequipo === eq.strtipoequipo),
    }));
  }

  fotoSrc(id: number): string | null { return this.fotosCache.get(id) ?? null; }
  fotosConGps(fotos: any[]): any[]   { return fotos.filter(f => f.dbllatitud); }
  ampliarFoto(id: number): void      { const s = this.fotosCache.get(id); if (s) this.fotoAmpliada = s; }
  cerrarFoto(): void                 { this.fotoAmpliada = null; }

  abrirEvaluar(o: any): void {
    this.ordenEvaluar = o;
    this.calificacionSeleccionada = (o.strcalificacion as 'A' | 'B' | 'C') || '';
    this.observacionEvaluacion = o.strobservacionevaluacion || '';
    this.cdr.detectChanges();
  }
  cerrarEvaluar(): void { this.ordenEvaluar = null; }
  confirmarEvaluar(): void {
    if (!this.ordenEvaluar || !this.calificacionSeleccionada) return;
    this.evaluando = true;
    this.procesoSrv.EvaluarOrden(this.ordenEvaluar.idorden, this.calificacionSeleccionada, this.observacionEvaluacion.trim()).subscribe({
      next: () => { this.evaluando = false; this.ordenEvaluar = null; this.cargarOrdenes(); this.cdr.detectChanges(); },
      error: () => { this.evaluando = false; this.cdr.detectChanges(); },
    });
  }

  abrirCambioEstado(o: any): void { this.ordenEstado = { ...o, nuevoEstado: o.strestado }; }
  cerrarCambioEstado(): void      { this.ordenEstado = null; }
  confirmarCambioEstado(): void {
    if (!this.ordenEstado) return;
    this.cambiandoEstado = true;
    this.procesoSrv.CambiarEstadoOrden(this.ordenEstado.idorden, this.ordenEstado.nuevoEstado).subscribe({
      next: () => { this.cambiandoEstado = false; this.ordenEstado = null; this.cargarOrdenes(); },
      error: () => { this.cambiandoEstado = false; },
    });
  }

  modificar(o: any): void { this.router.navigate(['/orden/nueva', o.strtipo], { queryParams: { idorden: o.idorden } }); }

  abrirEliminar(o: any): void { this.ordenEliminar = o; }
  cerrarEliminar(): void      { this.ordenEliminar = null; }
  confirmarEliminar(): void {
    if (!this.ordenEliminar) return;
    this.eliminando = true;
    this.procesoSrv.EliminarOrden(this.ordenEliminar.idorden).subscribe({
      next: () => { this.eliminando = false; this.ordenEliminar = null; this.cargarOrdenes(); },
      error: () => { this.eliminando = false; },
    });
  }
}
