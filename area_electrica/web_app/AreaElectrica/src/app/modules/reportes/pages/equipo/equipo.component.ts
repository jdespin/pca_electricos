import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reporte-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipo.component.html',
  styleUrl: './equipo.component.css',
})
export class EquipoReporteComponent implements OnInit {
  busqueda = '';
  ordenes: any[] = [];
  cargando = false;
  buscado = false;

  ngOnInit(): void {}

  buscar(): void {
    if (!this.busqueda.trim()) return;
    this.cargando = true;
    this.buscado = true;
    
    this.cargando = false;
  }

  exportarPDF(): void {
    
  }

  exportarExcel(): void {
    
  }
}
