import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiciosWebProceso } from '../../../../services/ServiciosWebProceso.service';

interface EquipoExterno {
  idequipoext?: number | null;
  idtipoequipo?: number | null;

  strequipo?: string;
  stridentificador?: string;
  strserie?: string;
  strconexion?: string;
  strtipoclase?: string;
  strplanoreferencia?: string;
  strfabricante?: string;
  strvoltajemegger?: string;
  strat?: string;
  strbt?: string;
  strcapacidad?: string;
  strtipofluido?: string;
  strpesoaceite?: string;
  strpesototal?: string;
  intanio?: number | null;
  strubicacion?: string;

  strtipoequipo?: string;

  blestado?: boolean;
  activo?: boolean;
}

@Component({
  selector: 'app-equipo-externo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipo-externo.component.html',
  styleUrls: ['./equipo-externo.component.css']
})

export class EquipoExternoComponent implements OnInit {
  listaEquipos: EquipoExterno[] = [];
  cargando = false;
  filtro = '';

  constructor(
    private procesoSrv: ServiciosWebProceso,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.listaEquiposExternos();
  }

  get equiposFiltrados(): EquipoExterno[] {
    const termino = this.normalizarTexto(this.filtro);

    if (!termino) {
      return this.listaEquipos;
    }

    return this.listaEquipos.filter((equipo) => {
      const textoBusqueda = this.normalizarTexto(
        [
          equipo.strequipo,
          equipo.stridentificador,
          equipo.strserie,
          equipo.strconexion,
          equipo.strtipoclase,
          equipo.strplanoreferencia,
          equipo.strfabricante,
          equipo.strvoltajemegger,
          equipo.strat,
          equipo.strbt,
          equipo.strcapacidad,
          equipo.strtipofluido,
          equipo.strpesoaceite,
          equipo.strpesototal,
          equipo.intanio?.toString(),
          equipo.strubicacion,
          equipo.strtipoequipo,
        ]
          .filter(Boolean)
          .join(' ')
      );

      return textoBusqueda.includes(termino);
    });
  }

  listaEquiposExternos(): void {
    this.cargando = true;

    this.procesoSrv.ListadoEquiposExternos().subscribe({
      next: (resp: any) => {
        this.listaEquipos = resp?.datos ?? [];
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error ListadoEquiposExternos:', err);
        this.listaEquipos = [];
        this.cargando = false;
      },
    });
  }

  crearNuevoEquipo(): void {
    this.router.navigate(['nuevo'], { relativeTo: this.route });
  }

  editarEquipo(equipo: EquipoExterno): void {
    const id = this.obtenerIdEquipo(equipo);
    if (!id) return;

    this.router.navigate(['editar', id], { relativeTo: this.route });
  }

  verDetalleEquipo(equipo: EquipoExterno): void {
    const id = this.obtenerIdEquipo(equipo);
    if (!id) return;

    this.router.navigate(['detalle', id], { relativeTo: this.route });
  }

  toggleEstadoEquipo(equipo: EquipoExterno): void {
    const id = this.obtenerIdEquipo(equipo);
    if (!id) return;

    const estadoActual = Boolean(equipo.blestado ?? equipo.activo);
    const nuevoEstado = !estadoActual;

    if ('blestado' in equipo) {
      equipo.blestado = nuevoEstado;
    } else {
      equipo.activo = nuevoEstado;
    }
  }

  trackByEquipo(index: number, item: EquipoExterno): number {
    return item.idequipoext ?? index;
  }

  private obtenerIdEquipo(equipo: EquipoExterno): number | null {
    return equipo.idequipoext ?? null;
  }

  private normalizarTexto(valor: string | null | undefined): string {
    return (valor ?? '').toString().trim().toLowerCase();
  }
}
