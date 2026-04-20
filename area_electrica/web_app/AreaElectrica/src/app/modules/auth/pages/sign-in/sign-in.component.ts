import { NgClass } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ServiciosWebSeguridad } from '../../../../services/ServiciosWebSeguridad.service';

const ROLES_PERMITIDOS = ['administrador', 'supervisor'];

function tieneRolPermitido(roles: any[]): boolean {
  return roles.some((r) => {
    const nombre = typeof r === 'string' ? r : (r?.rol_nombre ?? r?.rol_strnombre ?? '');
    return ROLES_PERMITIDOS.includes(nombre.toLowerCase());
  });
}

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
  imports: [FormsModule, ReactiveFormsModule, RouterLink, AngularSvgIconModule, ButtonComponent, NgClass],
})
export class SignInComponent implements OnInit {
  form!: FormGroup;
  submitted = false;

  loading          = signal(false);
  passwordVisible  = signal(false);

  modalVisible = signal(false);
  modalTitulo  = signal('');
  modalMensaje = signal('');
  modalTipo    = signal<'error' | 'warning'>('error');

  constructor(
    private readonly _formBuilder: FormBuilder,
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly _seguridad: ServiciosWebSeguridad,
  ) {}

  ngOnInit(): void {
    this.form = this._formBuilder.group({
      usuario:  ['', Validators.required],
      password: ['', Validators.required],
    });

    this._route.queryParams.subscribe((params) => {
      if (params['acceso'] === 'denegado') {
        this._mostrarModal('warning', 'Acceso denegado', 'No tienes autorización para acceder a este sistema. Comunícate con el administrador.');
      }
    });
  }

  get f() { return this.form.controls; }

  togglePasswordTextType() { this.passwordVisible.update(v => !v); }

  cerrarModal() { this.modalVisible.set(false); }

  private _mostrarModal(tipo: 'error' | 'warning', titulo: string, mensaje: string): void {
    this.modalTipo.set(tipo);
    this.modalTitulo.set(titulo);
    this.modalMensaje.set(mensaje);
    this.modalVisible.set(true);
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;

    const { usuario, password } = this.form.value;
    this.loading.set(true);

    this._seguridad.LoginApp(usuario, password, 'web').subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success) {
          const roles: any[] = res.roles ?? [];
          if (!tieneRolPermitido(roles)) {
            this._mostrarModal('warning', 'Acceso denegado', 'Tu cuenta no tiene los permisos necesarios para acceder a este sistema. Comunícate con el administrador.');
            return;
          }
          localStorage.setItem('idUsuario', res.idUsuario);
          localStorage.setItem('roles',    JSON.stringify(res.roles));
          localStorage.setItem('usuario',  usuario);
          localStorage.setItem('nombre',   res.nombre   ?? '');
          localStorage.setItem('apellido', res.apellido ?? '');
          localStorage.setItem('correo',   res.correo   ?? '');
          this._router.navigate(['/']);
        } else {
          this._mostrarModal('error', 'Error de autenticación', res.mensaje || 'Credenciales inválidas. Verifica tu usuario y contraseña.');
        }
      },
      error: () => {
        this.loading.set(false);
        this._mostrarModal('error', 'Error de conexión', 'No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.');
      },
    });
  }
}
