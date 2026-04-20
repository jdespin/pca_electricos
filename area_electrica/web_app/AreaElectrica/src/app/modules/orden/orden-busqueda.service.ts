import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OrdenBusquedaService {
  readonly termino = signal('');
  limpiar(): void { this.termino.set(''); }
}
