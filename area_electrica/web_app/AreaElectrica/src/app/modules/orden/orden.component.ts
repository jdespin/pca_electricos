import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, Subscription } from 'rxjs';
import { OrdenBusquedaService } from './orden-busqueda.service';

interface Migaja { label: string; link?: string; }

const RUTA_LABELS: Record<string, string> = {
  'todas':      'Todas las órdenes',
  'en-proceso': 'En proceso',
  'finalizada': 'Finalizadas',
  'evaluada':   'Evaluadas',
  'nueva':      'Nueva orden',
  'nuevo':      'Nueva orden',
  'editar':     'Editar orden',
};

const RUTAS_CON_TABS = ['todas', 'en-proceso', 'finalizada', 'evaluada'];

@Component({
  selector: 'app-orden',
  templateUrl: './orden.component.html',
  styleUrls: ['./orden.component.css'],
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
})
export class OrdenComponent implements OnInit, OnDestroy {
  migajas: Migaja[] = [];
  mostrarTabs = false;
  inputBusqueda = '';
  private _sub!: Subscription;

  readonly tabs = [
    {
      label: 'En proceso',
      ruta:  '/orden/en-proceso',
      color: '#F59E0B',
      icon:  'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    },
    {
      label: 'Finalizadas',
      ruta:  '/orden/finalizada',
      color: '#10B981',
      icon:  'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Evaluadas',
      ruta:  '/orden/evaluada',
      color: '#6366F1',
      icon:  'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    },
  ];

  constructor(
    private _router: Router,
    public busquedaSrv: OrdenBusquedaService,
  ) {}

  ngOnInit(): void {
    this._actualizar(this._router.url);
    this._sub = this._router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this._actualizar(e.urlAfterRedirects);
        this.limpiarBusqueda();
      });
  }

  ngOnDestroy(): void { this._sub?.unsubscribe(); }

  onBusqueda(valor: string): void {
    this.busquedaSrv.termino.set(valor.trim());
  }

  limpiarBusqueda(): void {
    this.inputBusqueda = '';
    this.busquedaSrv.limpiar();
  }

  private _actualizar(url: string): void {
    const segmento = url.split('/').find(s => RUTA_LABELS[s]) ?? 'todas';
    this.mostrarTabs = RUTAS_CON_TABS.includes(segmento);
    this.migajas = [
      { label: 'Dashboard', link: '/dashboard' },
      { label: 'Órdenes',   link: '/orden/todas' },
      { label: RUTA_LABELS[segmento] },
    ];
  }
}
