import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const ROLES_PERMITIDOS = ['administrador', 'supervisor'];

function extraerNombreRol(r: any): string {
  if (typeof r === 'string') return r.toLowerCase();
  return (r?.rol_nombre ?? r?.rol_strnombre ?? '').toLowerCase();
}

function tieneRolPermitido(): boolean {
  const roles: any[] = JSON.parse(localStorage.getItem('roles') || '[]');
  return roles.some((r) => ROLES_PERMITIDOS.includes(extraerNombreRol(r)));
}

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (!localStorage.getItem('idUsuario')) {
    return router.createUrlTree(['/auth/sign-in']);
  }

  if (!tieneRolPermitido()) {
    return router.createUrlTree(['/auth/sign-in'], {
      queryParams: { acceso: 'denegado' },
    });
  }

  return true;
};

export const noAuthGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (localStorage.getItem('idUsuario') && tieneRolPermitido()) {
    return router.createUrlTree(['/']);
  }

  return true;
};
