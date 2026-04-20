import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reporte-periodo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './periodo.component.html',
  styleUrl: './periodo.component.css',
})
export class PeriodoComponent implements OnInit {
  fechaDesde = '';
  fechaHasta = '';
  ordenes: any[] = [];
  cargando = false;
  buscado = false;

  ngOnInit(): void {}

  buscar(): void {
    if (!this.fechaDesde || !this.fechaHasta) return;
    this.cargando = true;
    this.buscado = true;
    
    this.cargando = false;
  }

  exportarPDF(): void {
    
  }

  exportarExcel(): void {
    
  }
}
