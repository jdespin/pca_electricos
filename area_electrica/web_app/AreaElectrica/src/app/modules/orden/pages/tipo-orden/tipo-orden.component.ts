import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tipo-orden',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tipo-orden.component.html',
  styleUrl: './tipo-orden.component.css',
})
export class TipoOrdenComponent {
  constructor(private router: Router) {}

  seleccionar(tipo: string): void {
    this.router.navigate(['/orden/nueva', tipo]);
  }

  volver(): void {
    this.router.navigate(['/dashboard']);
  }
}
