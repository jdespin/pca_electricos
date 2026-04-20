import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiciosWebSeguridad } from '../../../../services/ServiciosWebSeguridad.service';
import { FormsModule } from '@angular/forms';

type ModalModo = 'crear' | 'editar';

@Component({
  selector: 'app-rol',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rol.component.html',
  styleUrl: './rol.component.css',
})
export class RolComponent implements OnInit {
  listaRoles: any[] = [];
  cargando = false;
  filtro = '';

  modalAbierto = false;
  modalModo: ModalModo = 'crear';

  
  objRol: any = {
    idrol: null as number | null,
    rol_strcodigo: '',
    rol_strnombre: '',
    rol_strdescripcion: '',
    rol_blestado: true,
  };

  constructor(
    private seguridadSrv: ServiciosWebSeguridad,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.obtenerRoles();
  }

  obtenerRoles(): void {
    this.cargando = true;

    this.seguridadSrv.ListadoRolTodos().subscribe({
      next: (resp: any) => {
        
        this.listaRoles = resp?.datos ?? [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al listar roles', err);
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  trackByRol(index: number, item: any) {
    return item?.ouidrol ?? item?.idrol ?? index;
  }

  
  crearNuevo(): void {
    this.modalModo = 'crear';
    this.objRol = {
      idrol: null,
      rol_strcodigo: '',
      rol_strnombre: '',
      rol_strdescripcion: '',
      rol_blestado: true,
    };
    this.modalAbierto = true;
  }

  editarRol(r: any): void {
    this.modalModo = 'editar';

    
    this.objRol = {
      idrol: r.ouidrol ?? null,
      rol_strcodigo: r.ourol_strcodigo ?? '',
      rol_strnombre: r.ourol_strnombre ?? '',
      rol_strdescripcion: r.ourol_strdescripcion ?? '',
      rol_blestado: r.ourol_blestado === true,
    };


    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  get formInvalido(): boolean {
    return (
      !this.objRol.rol_strcodigo?.trim() ||
      !this.objRol.rol_strnombre?.trim() ||
      !this.objRol.rol_strdescripcion?.trim()
    );
  }

  guardarModal(): void {
    if (this.formInvalido) return;

    this.cargando = true;

    if (this.modalModo === 'crear') {
      
      
      const payload = {
        rol_strcodigo: this.objRol.rol_strcodigo,
        rol_strnombre: this.objRol.rol_strnombre,
        rol_strdescripcion: this.objRol.rol_strdescripcion,
        rol_blestado: this.objRol.rol_blestado, 
      };

      this.seguridadSrv.CrearRol(payload).subscribe({
        next: () => {
          this.cargando = false;
          this.cerrarModal();
          this.obtenerRoles();
        },
        error: (err: any) => {
          console.error('Error CrearRol', err);
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      
      const payload = {
        idrol: this.objRol.idrol, 
        rol_strcodigo: this.objRol.rol_strcodigo,
        rol_strnombre: this.objRol.rol_strnombre,
        rol_strdescripcion: this.objRol.rol_strdescripcion,
        rol_blestado: this.objRol.rol_blestado,
      };

      this.seguridadSrv.ActualizarRol(payload).subscribe({
        next: () => {
          this.cargando = false;
          this.cerrarModal();
          this.obtenerRoles();
        },
        error: (err: any) => {
          console.error('Error ActualizarRol', err);
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
    }
  }

  toggleEstado(r: any): void {
    const nuevoEstado = !r.ourol_blestado;

    const estadoAnterior = r.ourol_blestado;
    r.ourol_blestado = nuevoEstado;

    this.seguridadSrv.ActualizarRolEstado(r.ouidrol, nuevoEstado).subscribe({
      next: () => { },
      error: (err: any) => {
        console.error('Error ActualizarRolEstado', err);
        r.ourol_blestado = estadoAnterior;
      },
    });
  }
}
