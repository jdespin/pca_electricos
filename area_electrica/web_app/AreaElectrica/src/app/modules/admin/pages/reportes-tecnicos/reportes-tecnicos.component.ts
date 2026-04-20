import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ServiciosWebProceso } from '../../../../services/ServiciosWebProceso.service';

@Component({
  selector: 'app-reportes-tecnicos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes-tecnicos.component.html',
  styleUrl: './reportes-tecnicos.component.css',
})
export class ReportesTecnicosComponent implements OnInit {
  lista: any[] = [];
  cargando = false;
  filtro   = '';

  
  detalle: any | null = null;
  cargandoDetalle = false;

  
  fotosCache = new Map<number, string>();
  cargandoFotos = false;

  
  tabActivo: 'reporte' | 'equipos' = 'reporte';
  readonly tabs: { id: 'reporte' | 'equipos'; label: string }[] = [
    { id: 'reporte',  label: 'Reporte general' },
    { id: 'equipos',  label: 'Equipos y Fotografías' },
  ];

  
  fotoAmpliada: string | null = null;

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
  readonly estadoClasesMap: Record<string, string> = {
    proceso:    'bg-yellow-100 text-yellow-800',
    finalizada: 'bg-green-100 text-green-800',
    evaluada:   'bg-blue-100 text-blue-800',
  };
  readonly estadoLabelMap: Record<string, string> = {
    proceso:    'En proceso',
    finalizada: 'Finalizada',
    evaluada:   'Evaluada',
  };

  constructor(
    private procesoSrv: ServiciosWebProceso,
    private cdr: ChangeDetectorRef,
  ) {}

  @HostListener('document:visibilitychange')
  onVisibilityChange(): void {
    if (!document.hidden) this.cargar();
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.procesoSrv.ListarReportesTecnicos().subscribe({
      next: (r: any) => {
        this.lista    = r.datos ?? [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

  get listaFiltrada(): any[] {
    const f = (this.filtro || '').trim().toLowerCase();
    if (!f) return this.lista;
    return this.lista.filter(o =>
      (o.strcontrato || '').toLowerCase().includes(f) ||
      (o.strproyecto || '').toLowerCase().includes(f) ||
      (o.strlocacion || '').toLowerCase().includes(f) ||
      (o.strtipo     || '').toLowerCase().includes(f)
    );
  }

  estadoClases(e: string)    { return this.estadoClasesMap[e]  ?? 'bg-gray-100 text-gray-800'; }
  estadoLabel(e: string)     { return this.estadoLabelMap[e]   ?? e; }
  tipoLabel(t: string)       { return this.tipoLabels[t]       ?? t; }
  tipoEquipoLabel(t: string) { return this.tipoEquipoLabels[t] ?? t; }

  
  verDetalle(o: any): void {
    this.detalle         = { ...o, reportesOrden: [], reportesEquipo: [], fotosEquipo: [] };
    this.cargandoDetalle = true;
    this.tabActivo       = 'reporte';
    this.fotoAmpliada    = null;
    this.fotosCache      = new Map();

    this.procesoSrv.DetalleReporteTecnico(o.idorden).subscribe({
      next: (r: any) => {
        if (r?.success) {
          this.detalle = r.dato;
          this._cargarTodasLasFotos(r.dato?.fotosEquipo ?? []);
        }
        this.cargandoDetalle = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargandoDetalle = false; this.cdr.detectChanges(); },
    });
  }

  
  private _cargarTodasLasFotos(fotos: any[]): void {
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

  cerrarDetalle(): void {
    this.detalle      = null;
    this.fotoAmpliada = null;
    this.fotosCache   = new Map();
  }

  
  get equiposConFotos(): { reporte: any; fotos: any[] }[] {
    if (!this.detalle) return [];
    const reportes: any[] = this.detalle.reportesEquipo ?? [];
    const todasFotos: any[] = this.detalle.fotosEquipo ?? [];
    return reportes.map(eq => ({
      reporte: eq,
      fotos:   todasFotos.filter(f => f.strtipoequipo === eq.strtipoequipo),
    }));
  }

  fotoSrc(idfotoequipo: number): string | null {
    return this.fotosCache.get(idfotoequipo) ?? null;
  }

  fotosConGps(fotos: any[]): any[] {
    return fotos.filter(f => f.dbllatitud);
  }

  
  ampliarFoto(idfotoequipo: number): void {
    const src = this.fotosCache.get(idfotoequipo);
    if (src) this.fotoAmpliada = src;
  }

  cerrarFoto(): void { this.fotoAmpliada = null; }
}
