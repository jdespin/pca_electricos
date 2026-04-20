import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UrlServicios } from '../../services/urlServiciosWeb.component';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const nueva    = group.get('nuevaPassword')?.value;
  const confirma = group.get('confirmarPassword')?.value;
  return nueva && confirma && nueva !== confirma ? { mismatch: true } : null;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly _baseUrl: string;

  form: FormGroup;
  loading     = false;
  successMsg  = '';
  errorMsg    = '';
  showActual  = false;
  showNueva   = false;
  showConfirm = false;
  usuario   = localStorage.getItem('usuario')   ?? '—';
  idUsuario = localStorage.getItem('idUsuario') ?? '—';

  constructor(private fb: FormBuilder, private http: HttpClient, private cdr: ChangeDetectorRef, server: UrlServicios) {
    this._baseUrl = server.urlServicio;
    this.form = this.fb.group({
      actualPassword:    ['', Validators.required],
      nuevaPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmarPassword: ['', Validators.required],
    }, { validators: passwordsMatch });
  }

  get f() { return this.form.controls; }
  get mismatch(): boolean {
    return this.form.hasError('mismatch') && this.form.get('confirmarPassword')?.dirty === true;
  }

  onSubmit(): void {
    this.successMsg = '';
    this.errorMsg   = '';
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const idUsuario = localStorage.getItem('idUsuario');
    const usuario   = localStorage.getItem('usuario');
    if (!idUsuario || !usuario) { this.errorMsg = 'Sesión no válida.'; return; }

    this.loading = true;
    const { actualPassword, nuevaPassword } = this.form.value;

    this.http.post<any>(`${this._baseUrl}/rutausuario/CambiarPassword`, {
      idusuario:       idUsuario,
      usuario:         usuario,
      passwordActual:  actualPassword,
      passwordNueva:   nuevaPassword,
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.successMsg = 'Contraseña actualizada correctamente.';
          this.form.reset();
        } else {
          this.errorMsg = res.mensaje ?? 'No se pudo actualizar la contraseña.';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Error de conexión con el servidor.';
        this.cdr.detectChanges();
      }
    });
  }
}
