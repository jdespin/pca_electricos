import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ServiciosWebSeguridad } from '../../../../services/ServiciosWebSeguridad.service';
import { ServiciosWebCentral } from '../../../../services/ServiciosWebCentral.service';
import { onlyDigitsMaxLen } from '../../../../shared/utils/funciones_compartidas';

type ModalModo = 'crear' | 'editar';

type ToastType = 'success' | 'error' | 'warning' | 'info';



@Component({
  selector: 'app-user',
  standalone: true,
  templateUrl: './user.component.html',
  imports: [CommonModule, FormsModule],
})
export class UserComponent implements OnInit {


  
  debug = true;

  
  listaUsuarios: any[] = [];
  cargando = false;
  filtro = '';

  
  lsRoles: any[] = [];
  rolesSeleccionados: number[] = [];

  
  toasts: Array<{
    id: number;
    type: ToastType;
    title?: string;
    message: string;
  }> = [];
  private toastId = 0;


  
  modalBuscarCedula = false;   
  modalAbierto = false;        
  modalPassword = false;       
  modalDetalle = false;        
  modalConfirmToggle = false;  
  modalModo: ModalModo = 'crear';

  
  usuarioDetalle: any = null;

  
  usuarioPendienteToggle: any = null;

  
  cedula = '';
  cedulaInvalida = false;
  buscandoCedula = false;
  errorCedula = '';

  personaEncontrada: any = null;
  personaNoExiste = false;
  errorPersona = '';

  
  personaNueva: any = {
    strnombres: '',
    strapellidos: '',
    strcedula: '',
    strcorreo1: '',
    strcelular1: '',
    strtiposangre: '',
  };

  
  personaEditada: any = {
    idpersona: null,
    strnombres: '',
    strapellidos: '',
    strcedula: '',
    strcorreo1: '',
    strcelular1: '',
    strtiposangre: '',
  };

  
  usuarioSeleccionado: any = null;

  usuarioIdPersona: number | null = null;
  usuarioNombre = '';
  usuarioApellido = '';

  usuario = '';
  usuarioPassword = '';
  confirmarPassword = '';

  mostrarPassword = false;
  mostrarPasswordVisual = false;

  
  
  fotoPorDefecto = 'assets/images/user_logo.png';

  
  blSubirFoto = false;
  strfoto = '';        
  strfotoBackend = ''; 
  correoInvalido = false;

  
  validaciones = {
    longitud: false,
    mayuscula: false,
    minuscula: false,
    numero: false,
    caracterEspecial: false,
  };
  validacionesCompletas = false;

  
  errorUsuario = '';
  errorPassword = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private seguridadSrv: ServiciosWebSeguridad,
    private centralSrv: ServiciosWebCentral
  ) { }

  ngOnInit(): void {
    this.obtenerRoles();
    this.obtenerUsuarios();
  }

  
  
  
  private pushToast(type: ToastType, message: string, title?: string, ms = 4500) {
    const id = ++this.toastId;
    this.toasts.push({ id, type, message, title });

    setTimeout(() => this.removeToast(id), ms);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  
  toastSuccess(msg: string, title = 'Listo') { this.pushToast('success', msg, title); }
  toastError(msg: string, title = 'Error') { this.pushToast('error', msg, title, 6500); }
  toastWarning(msg: string, title = 'Atención') { this.pushToast('warning', msg, title, 5500); }
  toastInfo(msg: string, title = 'Info') { this.pushToast('info', msg, title); }



  private log(label: string, data?: any) {
    if (!this.debug) return;
    console.log(`[USER] ${label}`, data ?? '');
  }


  validarCorreoAuto(): void {
    const correo = (this.personaNueva.strcorreo1 ?? '').trim();
    this.correoInvalido = correo.length > 0 && !(correo.includes('@') && correo.includes('.'));
  }
soloNumeros(event: KeyboardEvent): void {
  const charCode = event.which ? event.which : event.keyCode;

  
  if (charCode < 48 || charCode > 57) {
    event.preventDefault();
  }
}

soloNumerosPegar(event: ClipboardEvent): void {
  const texto = event.clipboardData?.getData('text') ?? '';

  if (!/^\d+$/.test(texto)) {
    event.preventDefault();
  }
}

  
  
  
  obtenerUsuarios(): void {
    this.cargando = true;
    this.seguridadSrv.ListadoUsuarioPersonaTodos().subscribe({
      next: (resp: any) => {
        this.log('ListadoUsuariosPersona resp', resp);
        this.listaUsuarios = resp?.datos ?? [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error ListadoUsuariosPersona:', err);
        this.cargando = false;
        this.cdr.detectChanges();
        this.toastError('Error al listar usuarios.');
      },
    });
  }

  obtenerRoles(alAbrir = false): void {
    this.seguridadSrv.ListadoRolActivos().subscribe({
      next: (resp: any) => {
        console.log('[USER] ListadoRolActivos raw:', resp);
        const lista = resp?.datos ?? resp?.data ?? [];
        this.lsRoles = lista;
        console.log('[USER] lsRoles cargados:', this.lsRoles.length, this.lsRoles);
        this.cdr.detectChanges();
        if (alAbrir) this.modalAbierto = true;
      },
      error: (err: any) => {
        console.error('[USER] Error ListadoRolActivos:', err);
        this.toastError('No se pudieron cargar los roles. Verifica la conexión al servidor.');
        if (alAbrir) this.modalAbierto = true; 
      },
    });
  }

  get usuariosFiltrados(): any[] {
    const term = (this.filtro ?? '').trim().toLowerCase();
    if (!term) return this.listaUsuarios;
    return this.listaUsuarios.filter(u =>
      (u.strnombres       ?? u.oustrnombres       ?? '').toLowerCase().includes(term) ||
      (u.strapellidos     ?? u.oustrapellidos     ?? '').toLowerCase().includes(term) ||
      (u.usuario_strnombre ?? u.ouusuario_strnombre ?? '').toLowerCase().includes(term) ||
      (u.strcedula        ?? u.oustrcedula        ?? '').toLowerCase().includes(term)
    );
  }

  trackByUsuario(index: number, item: any) {
    return item?.idusuario ?? item?.ouidusuario ?? item?.idusuarios ?? index;
  }

  
  
  
  private async urlToDataUrl(url: string): Promise<string> {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`No se pudo leer la imagen: ${url}`);
    const blob = await resp.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('No se pudo convertir imagen a base64'));
      reader.readAsDataURL(blob);
    });
  }

  private async resolveFotoParaGuardar(modalModo: ModalModo): Promise<string> {
    
    if (this.blSubirFoto && this.strfoto) return this.strfoto;

    
    if (modalModo === 'editar' && this.strfotoBackend) return this.strfotoBackend;

    
    return await this.urlToDataUrl(this.fotoPorDefecto);
  }

  
  
  
  abrirBuscarCedula(): void {
    this.modalBuscarCedula = true;
    this.resetBusqueda();
  }

  cerrarBuscarCedula(): void {
    this.modalBuscarCedula = false;
  }

  resetBusqueda(): void {
    this.cedula = '';
    this.cedulaInvalida = false;
    this.buscandoCedula = false;
    this.errorCedula = '';
    this.errorPersona = '';

    this.personaEncontrada = null;
    this.personaNoExiste = false;

    this.personaNueva = {
      strnombres: '',
      strapellidos: '',
      strcedula: '',
      strcorreo1: '',
      strcelular1: '',
      strtiposangre: '',
    };

    this.log('resetBusqueda');
  }

  buscarCedula(): void {
    const ced = (this.cedula ?? '').trim();

    if (!/^\d{10}$/.test(ced)) {
      this.cedulaInvalida = true;
      this.errorCedula = 'La cédula debe tener exactamente 10 dígitos.';
      return;
    }

    this.buscandoCedula = true;
    this.personaEncontrada = null;
    this.personaNoExiste = false;
    this.errorPersona = '';

    this.log('Buscar cédula', ced);

    
    this.centralSrv.EncontrarPersonaDadoCedula(ced).subscribe({
      next: (resp: any) => {
        this.log('EncontrarPersonaDadoCedula resp', resp);

        const persona = resp?.datos?.[0] ?? null;

        if (persona) {
          this.personaEncontrada = persona;
          this.personaNoExiste = false;
          this.errorCedula = '';
        } else {
          this.personaNoExiste = true;
          this.personaNueva.strcedula = ced;
          this.errorCedula = 'No existe la persona. Complete los datos para registrarla.';
        }

        this.buscandoCedula = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error EncontrarPersonaDadoCedula:', err);
        this.buscandoCedula = false;
        this.errorCedula = 'Error al verificar la cédula.';
        this.cdr.detectChanges();
      },
    });
  }

  onCelularPersonaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const v = onlyDigitsMaxLen(input.value ?? '', 10);
    input.value = v;
    this.personaNueva.strcelular1 = v;
  }

  get puedeContinuarUsuario(): boolean {
    if (this.personaEncontrada) return true;

    if (!this.personaNoExiste) return false;

    const n = (this.personaNueva.strnombres ?? '').trim();
    const a = (this.personaNueva.strapellidos ?? '').trim();
    const c = (this.personaNueva.strcorreo1 ?? '').trim();
    const cel = (this.personaNueva.strcelular1 ?? '').trim();
    const ts = (this.personaNueva.strtiposangre ?? '').trim();

    const correoOk = c.includes('@') && c.includes('.');
    const celularOk = /^\d{10}$/.test(cel);

    return !!(n && a && correoOk && celularOk && ts);
  }

  continuarAUsuario(): void {

    this.errorPersona = '';

    const persona = this.personaEncontrada ?? this.personaNueva;

    this.usuarioIdPersona =
      persona?.idpersona ??
      persona?.ouidpersona ??
      null;

    this.usuarioNombre =
      persona?.strnombres ??
      persona?.nombres ??
      '';

    this.usuarioApellido =
      persona?.strapellidos ??
      persona?.apellidos ??
      '';

    if (this.personaNoExiste) this.cedula = (this.personaNueva.strcedula ?? '').trim();

    this.modalBuscarCedula = false;
    this.modalModo = 'crear';
    this.resetFormularioUsuario();
    this.modalAbierto = true;
    this.cdr.detectChanges();
  }

  
  
  
  cerrarModalUsuario(): void {
    this.modalAbierto = false;
  }

  resetFormularioUsuario(): void {
    this.usuarioSeleccionado = null;
    this.usuario = '';
    this.usuarioPassword = '';
    this.confirmarPassword = '';
    this.rolesSeleccionados = [];

    this.mostrarPassword = false;
    this.mostrarPasswordVisual = false;

    this.errorUsuario = '';
    this.validacionesCompletas = false;
    this.validaciones = {
      longitud: false,
      mayuscula: false,
      minuscula: false,
      numero: false,
      caracterEspecial: false,
    };

    
    this.blSubirFoto = false;
    this.strfoto = '';
    

    this.log('resetFormularioUsuario');
  }

  editarUsuario(u: any): void {
    this.modalModo = 'editar';
    this.usuarioSeleccionado = u;

    this.usuario = u.usuario_strnombre ?? u.ouusuario_strnombre ?? '';
    this.usuarioNombre = u.strnombres ?? '';
    this.usuarioApellido = u.strapellidos ?? '';
    this.usuarioIdPersona = u.usuario_idpersona ?? u.ouusuario_idpersona ?? null;

    
    this.personaEditada = {
      idpersona: u.usuario_idpersona ?? u.ouusuario_idpersona ?? null,
      strnombres: u.strnombres ?? '',
      strapellidos: u.strapellidos ?? '',
      strcedula: u.strcedula ?? '',
      strcorreo1: u.strcorreo1 ?? '',
      strcelular1: u.strcelular1 ?? '',
      strtiposangre: u.strtiposangre ?? '',
    };

    const roles = u.roles ?? [];
    this.rolesSeleccionados = roles
      .map((r: any) => (typeof r === 'number' ? r : (r.idrol ?? r.ouidrol)))
      .filter((x: any) => x != null);

    this.usuarioPassword = '';
    this.confirmarPassword = '';
    this.strfotoBackend = '';
    this.errorUsuario = '';
    
    this.obtenerRoles(true);   
    this.cdr.detectChanges();
  }

  verDetalle(u: any): void {
    this.usuarioDetalle = u;
    this.modalDetalle = true;
  }

  cerrarDetalle(): void {
    this.modalDetalle = false;
    this.usuarioDetalle = null;
  }

  isRolSeleccionado(idrol: number): boolean {
    return this.rolesSeleccionados.includes(idrol);
  }

  toggleRol(idrol: number): void {
    const idx = this.rolesSeleccionados.indexOf(idrol);
    if (idx >= 0) this.rolesSeleccionados.splice(idx, 1);
    else this.rolesSeleccionados.push(idrol);
  }

  validarPassword(): void {
    const pass = this.usuarioPassword || '';
    this.validaciones.longitud = pass.length >= 8;
    this.validaciones.mayuscula = /[A-Z]/.test(pass);
    this.validaciones.minuscula = /[a-z]/.test(pass);
    this.validaciones.numero = /[0-9]/.test(pass);
    this.validaciones.caracterEspecial = /[@$!%*?&]/.test(pass);
    this.validacionesCompletas = Object.values(this.validaciones).every((v) => v);
  }

  get puedeGuardarUsuario(): boolean {
    const u = (this.usuario ?? '').trim();
    const rolesOk = Array.isArray(this.rolesSeleccionados) && this.rolesSeleccionados.length > 0;

    if (this.modalModo === 'editar') {
      const nombresOk = !!(this.personaEditada.strnombres ?? '').trim();
      const apellidosOk = !!(this.personaEditada.strapellidos ?? '').trim();
      return !!(u && rolesOk && nombresOk && apellidosOk);
    }

    
    const personaOk = !!(this.personaEncontrada || this.personaNoExiste);
    const p1 = (this.usuarioPassword ?? '').trim();
    const p2 = (this.confirmarPassword ?? '').trim();
    const passMatch = p1 && p2 && p1 === p2;
    this.validarPassword();
    return !!(u && personaOk && rolesOk && passMatch && this.validacionesCompletas);
  }

  private buildObjPersonaParaBackend(): any {
    
    if (this.personaEncontrada) {
      return {
        idpersona: this.personaEncontrada?.idpersona ?? this.personaEncontrada?.ouidpersona ?? null,
        strnombres: (this.personaEncontrada?.strnombres ?? this.personaEncontrada?.nombres ?? '').trim(),
        strapellidos: (this.personaEncontrada?.strapellidos ?? this.personaEncontrada?.apellidos ?? '').trim(),
        strcedula: (this.personaEncontrada?.strcedula ?? this.cedula ?? '').trim(),
        strcorreo1: (this.personaEncontrada?.strcorreo1 ?? '').trim(),
        strcelular1: (this.personaEncontrada?.strcelular1 ?? '').trim(),
        strtiposangre: (this.personaEncontrada?.strtiposangre ?? '').trim(),
        dtfechamodificacion: new Date().toISOString(),
      };
    }

    
    return {
      idpersona: null,
      strnombres: (this.personaNueva.strnombres ?? '').trim(),
      strapellidos: (this.personaNueva.strapellidos ?? '').trim(),
      strcedula: (this.personaNueva.strcedula ?? this.cedula ?? '').trim(),
      strcorreo1: (this.personaNueva.strcorreo1 ?? '').trim(),
      strcelular1: (this.personaNueva.strcelular1 ?? '').trim(),
      strtiposangre: (this.personaNueva.strtiposangre ?? '').trim(),
      dtfechamodificacion: new Date().toISOString(),
    };
  }




  async guardarUsuario(): Promise<void> {
    this.errorUsuario = '';

    if (!this.puedeGuardarUsuario) {
      if (!this.usuario.trim()) {
        this.errorUsuario = 'El nombre de usuario es obligatorio.';
      } else if (!this.rolesSeleccionados?.length) {
        this.errorUsuario = 'Debe seleccionar al menos un rol.';
      } else if (this.modalModo === 'crear') {
        if (!this.usuarioPassword.trim() || !this.confirmarPassword.trim()) {
          this.errorUsuario = 'Contraseña y confirmación son obligatorias.';
        } else if (this.usuarioPassword !== this.confirmarPassword) {
          this.errorUsuario = 'Las contraseñas no coinciden.';
        } else if (!this.validacionesCompletas) {
          this.errorUsuario = 'La contraseña no cumple los requisitos de seguridad.';
        } else {
          this.errorUsuario = 'Revise los campos obligatorios.';
        }
      } else {
        this.errorUsuario = 'Nombres y apellidos son obligatorios.';
      }
      this.toastWarning(this.errorUsuario);
      return;
    }

    try {
      
      
      
      if (this.modalModo === 'editar') {
        const objUsuario = {
          idusuario: this.usuarioSeleccionado?.idusuario ?? this.usuarioSeleccionado?.ouidusuario,
          usuario_strnombre: this.usuario.trim(),
          objPersona: {
            idpersona: this.personaEditada.idpersona,
            strnombres: (this.personaEditada.strnombres ?? '').trim(),
            strapellidos: (this.personaEditada.strapellidos ?? '').trim(),
            strcedula: (this.personaEditada.strcedula ?? '').trim(),
            strcorreo1: (this.personaEditada.strcorreo1 ?? '').trim(),
            strcelular1: (this.personaEditada.strcelular1 ?? '').trim(),
            strtiposangre: (this.personaEditada.strtiposangre ?? '').trim(),
          },
          objPerfil: this.rolesSeleccionados.map((idrol) => ({ idrol })),
        };

        const resp = await new Promise<any>((resolve, reject) =>
          this.seguridadSrv.ActualizarUsuarioCompleto({ objUsuario }).subscribe(resolve, reject)
        );

        if (resp?.success !== true) {
          this.errorUsuario = resp?.error ?? 'No se pudo actualizar el usuario.';
          this.toastError(this.errorUsuario);
          return;
        }

        
        const u = this.usuarioSeleccionado;
        u.usuario_strnombre = objUsuario.usuario_strnombre;
        u.strnombres        = objUsuario.objPersona.strnombres;
        u.strapellidos      = objUsuario.objPersona.strapellidos;
        u.strcorreo1        = objUsuario.objPersona.strcorreo1;
        u.strcelular1       = objUsuario.objPersona.strcelular1;
        u.strtiposangre     = objUsuario.objPersona.strtiposangre;
        u.roles             = this.rolesSeleccionados.map(idrol => {
          const rol = this.lsRoles.find((r: any) => r.ouidrol === idrol);
          return { idrol, rol_strnombre: rol?.ourol_strnombre ?? '' };
        });

        this.toastSuccess('Usuario actualizado correctamente.');
        this.cerrarModalUsuario();
        this.cdr.detectChanges();
        return;
      }

      
      
      
      const existe = await new Promise<any>((resolve, reject) =>
        this.seguridadSrv.ObtenerUsuarioDadoNombreUsuario(this.usuario).subscribe(resolve, reject)
      );
      if (existe?.datos?.[0]) {
        this.errorUsuario = 'El nombre de usuario ya está en uso.';
        this.toastError(this.errorUsuario);
        return;
      }

      let clave = this.usuarioPassword;
      try {
        const enc = await new Promise<any>((resolve, reject) =>
          this.seguridadSrv.EncriptarToken(this.usuarioPassword).subscribe(resolve, reject)
        );
        clave = enc?.datos?.[0] ?? enc?.token ?? clave;
      } catch {
        this.toastWarning('No se pudo encriptar la contraseña. Se enviará en texto plano.');
      }

      const objPersona = this.buildObjPersonaParaBackend();
      const fotoFinal = await this.resolveFotoParaGuardar(this.modalModo);
      const objPersonaConFoto = { ...objPersona, strfoto: fotoFinal };

      if (!objPersonaConFoto.strcedula || !/^\d{10}$/.test(String(objPersonaConFoto.strcedula).trim())) {
        this.errorUsuario = 'La cédula de la persona es inválida o está vacía.';
        this.toastWarning(this.errorUsuario);
        return;
      }

      const objUsuario: any = {
        usuario_strnombre: this.usuario.trim(),
        usuario_strclave: clave,
        objPersona: objPersonaConFoto,
        objPerfil: this.rolesSeleccionados.map((idrol) => ({ idrol })),
      };

      const resp = await new Promise<any>((resolve, reject) =>
        this.seguridadSrv.GuardarUsuarioPersona({ objUsuario }).subscribe(resolve, reject)
      );

      if (resp?.success !== true) {
        this.errorUsuario = resp?.error ?? resp?.mensaje ?? 'No se pudo crear el usuario.';
        this.toastError(this.errorUsuario);
        return;
      }

      this.toastSuccess(resp?.mensaje ?? 'Usuario creado correctamente.');
      this.cerrarModalUsuario();
      this.obtenerUsuarios();

    } catch (e: any) {
      this.errorUsuario = e?.error?.error || e?.error?.mensaje || 'Error inesperado al guardar.';
      this.toastError(this.errorUsuario);
    }
  }


  
  
  
  abrirCambiarPassword(u: any): void {
    this.usuarioSeleccionado = u;
    this.modalPassword = true;

    this.usuarioPassword = '';
    this.confirmarPassword = '';
    this.errorPassword = '';

    this.mostrarPassword = false;
    this.mostrarPasswordVisual = false;

    this.validacionesCompletas = false;
    this.validarPassword();
  }

  cerrarModalPassword(): void {
    this.modalPassword = false;
  }

  async guardarNuevaPassword(): Promise<void> {
    this.errorPassword = '';

    if (!this.usuarioPassword.trim() || !this.confirmarPassword.trim()) {
      this.errorPassword = 'Todos los campos son obligatorios.';
      return;
    }
    if (this.usuarioPassword !== this.confirmarPassword) {
      this.errorPassword = 'Las contraseñas no coinciden.';
      return;
    }

    this.validarPassword();
    if (!this.validacionesCompletas) {
      this.errorPassword = 'La contraseña no cumple requisitos (8, mayúscula, minúscula, número, especial).';
      return;
    }

    try {
      let clave = this.usuarioPassword;
      try {
        const enc = await new Promise<any>((resolve, reject) =>
          this.seguridadSrv.EncriptarToken(this.usuarioPassword).subscribe(resolve, reject)
        );
        clave = enc?.datos?.[0] ?? enc?.token ?? clave;
      } catch { }

      const objUsuario = {
        idusuario: this.usuarioSeleccionado?.idusuario ?? this.usuarioSeleccionado?.ouidusuario ?? this.usuarioSeleccionado?.idusuarios,
        usuario_strclave: clave,
        usuario_strnombre: this.usuarioSeleccionado?.usuario_strnombre ?? this.usuarioSeleccionado?.ouusuario_strnombre,
        usuario_idpersona: this.usuarioSeleccionado?.usuario_idpersona ?? this.usuarioSeleccionado?.ouusuario_idpersona,
      };

      const payload = { objUsuario };

      const resp = await new Promise<any>((resolve, reject) =>
        this.seguridadSrv.ActualizarUsuario(payload).subscribe(resolve, reject)
      );

      if (resp?.success) {
        this.toastSuccess('Contraseña actualizada con éxito.');
        this.cerrarModalPassword();
      } else {
        this.toastError(resp?.error ?? 'No se pudo actualizar la contraseña.');
      }
    } catch (e) {
      console.error(e);
      this.toastError('Error al actualizar contraseña.');
    }
  }

  
  
  
  toggleEstadoUsuario(u: any): void {
    this.usuarioPendienteToggle = u;
    this.modalConfirmToggle = true;
  }

  cancelarToggleEstado(): void {
    this.modalConfirmToggle = false;
    this.usuarioPendienteToggle = null;
  }

  confirmarToggleEstado(): void {
    const u = this.usuarioPendienteToggle;
    this.modalConfirmToggle = false;
    this.usuarioPendienteToggle = null;
    if (!u) return;

    const idUsuario = u.idusuario ?? u.ouidusuario ?? u.idusuarios;
    if (!idUsuario) return;

    const actual = (u.usuario_blestado ?? u.ouusuario_blestado ?? u.estado) === true;
    const nuevoBool = !actual;

    u.usuario_blestado = nuevoBool;
    this.cdr.detectChanges();

    this.seguridadSrv.ActualizarUsuarioEstado(idUsuario, nuevoBool).subscribe({
      next: (resp: any) => {
        if (resp?.success) this.toastSuccess('Estado actualizado con éxito.');
        else throw new Error('Respuesta inválida');
      },
      error: (err: any) => {
        console.error('Error ActualizarUsuarioEstado:', err);
        u.usuario_blestado = actual;
        this.cdr.detectChanges();
        this.toastError('No se pudo cambiar el estado.');
      },
    });
  }
}
