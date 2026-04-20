import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosWebProceso } from '../../../../services/ServiciosWebProceso.service';
import { PdfExportService } from '../../../../services/pdf-export.service';

@Component({
  selector: 'app-uso-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './uso-equipo.component.html',
})
export class UsoEquipoComponent {
  fechaDesde = '';
  fechaHasta = '';
  filtroTecnico = '';
  registros: any[] = [];
  cargando = false;
  buscado = false;

  constructor(
    private procesoSrv: ServiciosWebProceso,
    private pdfSrv: PdfExportService,
    private cdr: ChangeDetectorRef,
  ) {}

  get registrosFiltrados(): any[] {
    const f = this.filtroTecnico.trim().toLowerCase();
    if (!f) return this.registros;
    return this.registros.filter(r =>
      (r.strnombretecnico ?? '').toLowerCase().includes(f) ||
      (r.strequipo ?? '').toLowerCase().includes(f)
    );
  }

  buscar(): void {
    this.cargando = true;
    this.buscado = true;
    this.procesoSrv.ReporteUsoEquipo(this.fechaDesde || null, this.fechaHasta || null).subscribe({
      next: (resp: any) => {
        this.registros = resp?.datos ?? [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.registros = [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  limpiar(): void {
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.filtroTecnico = '';
    this.registros = [];
    this.buscado = false;
  }

  exportarPDF(): void {
    this.pdfSrv.exportarUsoEquipo(this.registrosFiltrados, this.fechaDesde, this.fechaHasta);
  }

  formatFechaHora(val: any): string {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  }
}
