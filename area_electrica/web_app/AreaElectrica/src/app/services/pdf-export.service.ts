import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class PdfExportService {

  private readonly COMPANY  = 'PCA Área Eléctrica';
  private readonly PRIMARY  = [9, 62, 128] as [number, number, number];   
  private readonly GRAY_HDR = [248, 250, 252] as [number, number, number]; 
  private readonly GRAY_TXT = [75, 85, 99]  as [number, number, number];   

  private readonly ESTADO_LABEL: Record<string, string> = {
    proceso:    'En proceso',
    finalizada: 'Finalizada',
    evaluada:   'Evaluada',
  };

  private readonly TIPO_LABEL: Record<string, string> = {
    inspeccion:    'Inspección',
    mantenimiento: 'Mantenimiento',
    instalacion:   'Instalación',
  };

  

  private formatFecha(val: string | null | undefined): string {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private addHeader(doc: jsPDF, titulo: string, subtitulo?: string): number {
    const pageW = doc.internal.pageSize.getWidth();

    
    doc.setFillColor(...this.PRIMARY);
    doc.rect(0, 0, pageW, 22, 'F');

    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(this.COMPANY, 14, 10);

    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(titulo, 14, 17);

    
    const hoy = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
    doc.setFontSize(8);
    doc.text(`Emisión: ${hoy}`, pageW - 14, 17, { align: 'right' });

    if (subtitulo) {
      doc.setTextColor(...this.GRAY_TXT);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(subtitulo, 14, 29);
      return 34;
    }

    return 30;
  }

  

  exportarLista(ordenes: any[], filtroEstado: string, filtroBusqueda: string): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const filtroDesc = [
      filtroEstado  ? `Estado: ${this.ESTADO_LABEL[filtroEstado] ?? filtroEstado}` : '',
      filtroBusqueda ? `Búsqueda: "${filtroBusqueda}"` : '',
    ].filter(Boolean).join('  |  ');

    const y = this.addHeader(
      doc,
      'Listado de Órdenes de Trabajo',
      filtroDesc || 'Todas las órdenes'
    );

    const filas = ordenes.map((o, i) => [
      String(o.idorden),
      this.TIPO_LABEL[o.strtipo]   ?? o.strtipo   ?? '—',
      o.strcontrato  || '—',
      o.strproyecto  || '—',
      o.strlocacion  || '—',
      o.strregistro  || '—',
      this.formatFecha(o.dtfecha),
      this.ESTADO_LABEL[o.strestado] ?? o.strestado ?? '—',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['ID', 'Tipo', 'Contrato', 'Proyecto', 'Locación', 'Registro', 'Fecha', 'Estado']],
      body: filas,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: this.PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 14, halign: 'center' },
        1: { cellWidth: 30 },
        6: { cellWidth: 22, halign: 'center' },
        7: { cellWidth: 26, halign: 'center' },
      },
      didDrawCell: (data) => {
        
        if (data.section === 'body' && data.column.index === 7) {
          const estado = ordenes[data.row.index]?.strestado;
          const color = this.estadoColor(estado);
          doc.setFillColor(...color.bg);
          doc.roundedRect(data.cell.x + 2, data.cell.y + 1.5, data.cell.width - 4, data.cell.height - 3, 2, 2, 'F');
          doc.setTextColor(...color.txt);
          doc.setFontSize(7);
          doc.text(
            this.ESTADO_LABEL[estado] ?? estado ?? '',
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 1,
            { align: 'center' }
          );
          return false;
        }
        return;
      },
    });

    this.addPageNumbers(doc);
    doc.save(`ordenes_trabajo_${this.timestamp()}.pdf`);
  }

  

  exportarDetalle(orden: any): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    let y = this.addHeader(
      doc,
      `Orden de Trabajo #${orden.idorden}`,
      `Tipo: ${this.TIPO_LABEL[orden.strtipo] ?? orden.strtipo ?? '—'}`
    );

    
    const estadoTxt = this.ESTADO_LABEL[orden.strestado] ?? orden.strestado ?? '—';
    const badgeColor = this.estadoColor(orden.strestado);
    doc.setFillColor(...badgeColor.bg);
    doc.roundedRect(14, y, 36, 7, 2, 2, 'F');
    doc.setTextColor(...badgeColor.txt);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(estadoTxt, 32, y + 4.5, { align: 'center' });
    y += 14;

    
    doc.setTextColor(...this.GRAY_TXT);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS GENERALES', 14, y);
    doc.setDrawColor(...this.PRIMARY);
    doc.setLineWidth(0.4);
    doc.line(14, y + 1.5, pageW - 14, y + 1.5);
    y += 6;

    const campos: [string, string][] = [
      ['Contrato',        orden.strcontrato      || '—'],
      ['Proyecto',        orden.strproyecto      || '—'],
      ['Registro',        orden.strregistro      || '—'],
      ['Locación',        orden.strlocacion      || '—'],
      ['Pozo',            orden.strpozo          || '—'],
      ['Fecha',           this.formatFecha(orden.dtfecha)],
      ['Fecha creación',  orden.dtfechacreacion  || '—'],
    ];

    const col1 = campos.slice(0, 4);
    const col2 = campos.slice(4);

    autoTable(doc, {
      startY: y,
      body: col1.map(([k, v]) => [k, v]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 38, fillColor: this.GRAY_HDR, textColor: this.GRAY_TXT },
        1: { cellWidth: 60 },
      },
      theme: 'plain',
      margin: { left: 14, right: pageW / 2 + 2 },
    });

    const afterCol1 = (doc as any).lastAutoTable.finalY;

    autoTable(doc, {
      startY: y,
      body: col2.map(([k, v]) => [k, v]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 38, fillColor: this.GRAY_HDR, textColor: this.GRAY_TXT },
        1: { cellWidth: 60 },
      },
      theme: 'plain',
      margin: { left: pageW / 2 + 2, right: 14 },
    });

    y = Math.max(afterCol1, (doc as any).lastAutoTable.finalY) + 8;

    
    doc.setTextColor(...this.GRAY_TXT);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PERSONAL ASIGNADO', 14, y);
    doc.setDrawColor(...this.PRIMARY);
    doc.setLineWidth(0.4);
    doc.line(14, y + 1.5, pageW - 14, y + 1.5);
    y += 6;

    const personal: any[] = orden.personal ?? [];
    if (personal.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(8);
      doc.text('Sin personal asignado.', 14, y + 4);
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Nombre', 'Rol']],
        body: personal.map(p => [
          p.nombre ?? '—',
          p.boolider ? 'Líder' : 'Técnico',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: this.PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          1: { cellWidth: 30, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
      });
    }

    this.addPageNumbers(doc);
    doc.save(`orden_${orden.idorden}_${this.timestamp()}.pdf`);
  }

  

  exportarUsoEquipo(registros: any[], desde: string, hasta: string): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const rango = desde && hasta
      ? `Período: ${this.formatFecha(desde)} — ${this.formatFecha(hasta)}`
      : desde ? `Desde: ${this.formatFecha(desde)}`
      : hasta ? `Hasta: ${this.formatFecha(hasta)}`
      : 'Todos los registros';

    const y = this.addHeader(doc, 'Reporte de Uso de Equipos', rango);

    const filas = registros.map(r => [
      r.strnombretecnico || '—',
      r.strequipo        || '—',
      `${r.strmarca ?? ''} ${r.strmodelo ?? ''}`.trim() || '—',
      r.strserie         || '—',
      this.formatFechaHora(r.dtfechainicio),
      r.dtfechafin ? this.formatFechaHora(r.dtfechafin) : '—',
      r.blactivo ? 'En uso' : 'Devuelto',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Técnico', 'Equipo', 'Marca / Modelo', 'Serie', 'Fecha solicitud', 'Fecha devolución', 'Estado']],
      body: filas,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: this.PRIMARY, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 32 },
        2: { cellWidth: 38 },
        3: { cellWidth: 28 },
        4: { cellWidth: 32, halign: 'center' },
        5: { cellWidth: 32, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' },
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          const enUso = registros[data.row.index]?.blactivo;
          const bg: [number,number,number] = enUso ? [254, 249, 195] : [220, 252, 231];
          const txt: [number,number,number] = enUso ? [133, 77, 14]  : [22, 101, 52];
          doc.setFillColor(...bg);
          doc.roundedRect(data.cell.x + 1.5, data.cell.y + 1.5, data.cell.width - 3, data.cell.height - 3, 2, 2, 'F');
          doc.setTextColor(...txt);
          doc.setFontSize(7);
          doc.text(
            enUso ? 'En uso' : 'Devuelto',
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 1,
            { align: 'center' }
          );
          return false;
        }
        return;
      },
    });

    this.addPageNumbers(doc);
    doc.save(`uso_equipos_${this.timestamp()}.pdf`);
  }

  private formatFechaHora(val: string | null | undefined): string {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val as string;
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  }

  private estadoColor(estado: string): { bg: [number,number,number]; txt: [number,number,number] } {
    switch (estado) {
      case 'proceso':    return { bg: [254, 249, 195], txt: [133, 77, 14]  };
      case 'finalizada': return { bg: [220, 252, 231], txt: [22, 101, 52]  };
      case 'evaluada':   return { bg: [219, 234, 254], txt: [30, 64, 175]  };
      default:           return { bg: [243, 244, 246], txt: [75, 85, 99]   };
    }
  }

  private addPageNumbers(doc: jsPDF): void {
    const total  = doc.getNumberOfPages();
    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(`Página ${i} de ${total}`, pageW - 14, pageH - 6, { align: 'right' });
      doc.text(this.COMPANY, 14, pageH - 6);
    }
  }

  private timestamp(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  }
}
