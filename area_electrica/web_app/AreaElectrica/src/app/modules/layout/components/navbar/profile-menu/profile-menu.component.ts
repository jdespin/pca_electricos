import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ThemeService } from '../../../../../core/services/theme.service';
import { ClickOutsideDirective } from '../../../../../shared/directives/click-outside.directive';
import { UrlServicios } from '../../../../../services/urlServiciosWeb.component';

@Component({
  selector: 'app-profile-menu',
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.css'],
  imports: [ClickOutsideDirective, RouterLink, AngularSvgIconModule],
  animations: [
    trigger('openClose', [
      state('open',   style({ opacity: 1, transform: 'translateY(0)',    visibility: 'visible' })),
      state('closed', style({ opacity: 0, transform: 'translateY(-20px)', visibility: 'hidden'  })),
      transition('open => closed', [animate('0.2s')]),
      transition('closed => open', [animate('0.2s')]),
    ]),
  ],
})
export class ProfileMenuComponent implements OnInit {
  public isOpen = false;
  public nombreCompleto = '';
  public correo = '';
  public iniciales = '';

  public profileMenu = [
    { title: 'Tu perfil',     icon: './assets/icons/heroicons/outline/user-circle.svg', link: '/profile'  },
    { title: 'Configuración', icon: './assets/icons/heroicons/outline/cog-6-tooth.svg', link: '/settings' },
  ];

  private readonly _baseUrl: string;

  constructor(public themeService: ThemeService, private http: HttpClient, server: UrlServicios, private _router: Router) {
    this._baseUrl = server.urlServicio;
  }

  ngOnInit(): void {
    const idUsuario = localStorage.getItem('idUsuario');
    if (idUsuario) {
      this.http.get<any>(`${this._baseUrl}/rutausuario/PerfilUsuario/${idUsuario}`)
        .subscribe({
          next: (res) => {
            if (res.success && res.dato) {
              const nombre   = res.dato.strnombres   ?? '';
              const apellido = res.dato.strapellidos ?? '';
              this.correo    = res.dato.strcorreo1   ?? '';
              this.nombreCompleto = `${nombre} ${apellido}`.trim() || res.dato.usuario_strnombre || '';
              
              localStorage.setItem('nombre',   nombre);
              localStorage.setItem('apellido', apellido);
              localStorage.setItem('correo',   this.correo);
            } else {
              this._cargarDesdeStorage();
            }
            this._calcularIniciales();
          },
          error: () => {
            this._cargarDesdeStorage();
            this._calcularIniciales();
          }
        });
    } else {
      this._cargarDesdeStorage();
      this._calcularIniciales();
    }
  }

  private _cargarDesdeStorage(): void {
    const nombre   = localStorage.getItem('nombre')   ?? '';
    const apellido = localStorage.getItem('apellido') ?? '';
    const usuario  = localStorage.getItem('usuario')  ?? '';
    this.correo         = localStorage.getItem('correo') ?? '';
    this.nombreCompleto = (nombre || apellido) ? `${nombre} ${apellido}`.trim() : usuario;
  }

  private _calcularIniciales(): void {
    const partes = this.nombreCompleto.trim().split(' ').filter(Boolean);
    this.iniciales = partes.length >= 2
      ? (partes[0][0] + partes[1][0]).toUpperCase()
      : this.nombreCompleto.substring(0, 2).toUpperCase();
  }

  public toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  public logout(): void {
    localStorage.clear();
    this._router.navigate(['/auth/sign-in']);
  }

  toggleThemeMode() {
    this.themeService.theme.update((theme) => {
      const mode = !this.themeService.isDark ? 'dark' : 'light';
      return { ...theme, mode: mode };
    });
  }
}
