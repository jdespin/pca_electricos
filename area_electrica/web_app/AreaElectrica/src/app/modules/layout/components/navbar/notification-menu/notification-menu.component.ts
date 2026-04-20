import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ServiciosWebProceso } from '../../../../../services/ServiciosWebProceso.service';

export interface Notificacion {
  idnotificacion: number;
  idorden: number | null;
  idequipointerno: number | null;
  strtitulo: string;
  strmensaje: string;
  boolleida: boolean;
  fechacreacion: string;
  strtipo?: string;
}

@Component({
  selector: 'app-notification-menu',
  templateUrl: './notification-menu.component.html',
  styleUrls: ['./notification-menu.component.css'],
  imports: [CommonModule, RouterLink],
})
export class NotificationMenuComponent implements OnInit, OnDestroy {
  modalAbierto = false;
  notificaciones: Notificacion[] = [];
  cargando = false;

  private idUsuario: number | null = null;
  private intervalo: any = null;

  constructor(
    private procesoSrv: ServiciosWebProceso,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const raw = localStorage.getItem('idUsuario');
    this.idUsuario = raw ? Number(raw) : null;
    if (this.idUsuario) {
      this.cargarNotificaciones();
      this.intervalo = setInterval(() => this.cargarNotificaciones(), 30_000);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  get noLeidas(): number {
    return this.notificaciones.filter(n => !n.boolleida).length;
  }

  cargarNotificaciones(): void {
    if (!this.idUsuario) return;
    this.procesoSrv.ObtenerNotificaciones(this.idUsuario).subscribe({
      next: (resp: any) => {
        this.notificaciones = resp?.datos ?? [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  abrirModal(): void {
    this.modalAbierto = true;
    this.cargarNotificaciones();
    if (this.noLeidas > 0) {
      this.marcarTodasLeidas();
    }
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  marcarLeida(n: Notificacion): void {
    if (n.boolleida) return;
    n.boolleida = true;
    this.procesoSrv.MarcarNotificacionLeida(n.idnotificacion).subscribe({ error: () => {} });
    this.cdr.detectChanges();
  }

  marcarTodasLeidas(): void {
    if (!this.idUsuario) return;
    this.notificaciones.forEach(n => n.boolleida = true);
    this.procesoSrv.MarcarTodasNotificacionesLeidas(this.idUsuario).subscribe({ error: () => {} });
    this.cdr.detectChanges();
  }

  irANotificacion(n: Notificacion): void {
    this.marcarLeida(n);
    if (n.idequipointerno) {
      this.router.navigate(['/admin/equipo_interno'], { queryParams: { verEquipo: n.idequipointerno } });
    } else if (n.idorden) {
      this.router.navigate(['/orden/finalizada'], { queryParams: { openReporte: n.idorden } });
    }
    this.cerrarModal();
  }

  tiempoRelativo(fecha: string): string {
    const ms = Date.now() - new Date(fecha).getTime();
    const mins = Math.floor(ms / 60_000);
    if (mins < 1)  return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `Hace ${hrs} h`;
    const dias = Math.floor(hrs / 24);
    if (dias < 7)  return `Hace ${dias} d`;
    return new Date(fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
  }
}
