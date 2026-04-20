import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { UrlServicios } from '../../services/urlServiciosWeb.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  private readonly _baseUrl: string;

  loading = true;
  perfil: any = null;
  iniciales = '';
  roles: string[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, server: UrlServicios) {
    this._baseUrl = server.urlServicio;
  }

  ngOnInit(): void {
    const idUsuario = localStorage.getItem('idUsuario');
    const rolesRaw  = localStorage.getItem('roles');

    if (rolesRaw) {
      try {
        const arr = JSON.parse(rolesRaw) as any[];
        this.roles = arr.map(r => r.rol_strnombre ?? r.rol_nombre ?? '').filter(Boolean);
      } catch {}
    }

    if (!idUsuario) { this.loading = false; return; }

    this.http.get<any>(`${this._baseUrl}/rutausuario/PerfilUsuario/${idUsuario}`)
      .subscribe({
        next: (res) => {
          if (res.success && res.dato) {
            this.perfil = res.dato;
            const n = (res.dato.strnombres   ?? '').trim();
            const a = (res.dato.strapellidos ?? '').trim();
            const partes = `${n} ${a}`.trim().split(' ').filter(Boolean);
            this.iniciales = partes.length >= 2
              ? (partes[0][0] + partes[1][0]).toUpperCase()
              : (partes[0]?.[0] ?? '?').toUpperCase();
          }
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  get nombreCompleto(): string {
    if (!this.perfil) return localStorage.getItem('usuario') ?? '—';
    const n = (this.perfil.strnombres   ?? '').trim();
    const a = (this.perfil.strapellidos ?? '').trim();
    return `${n} ${a}`.trim() || this.perfil.usuario_strnombre || '—';
  }
}
