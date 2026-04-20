import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiciosWebCentral } from '../../../../services/ServiciosWebCentral.service';

import {
  onlyDigitsMaxLen,
  fileToDataUrl,
  ensureImageDataUrl,
  urlToDataUrl
} from '../../../../shared/utils/funciones_compartidas';

type ModalModo = 'crear' | 'editar';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.css',
})
export class PersonalComponent implements OnInit {
  listaPersonas: any[] = [];
  cargando = false;
  filtro = '';

  modalAbierto = false;
  modalModo: ModalModo = 'crear';

  objPersona: any = {
    idpersona: null,
    strnombres: '',
    strapellidos: '',
    strcedula: '',
    strcorreo1: '',
    strcelular1: '',
    strtiposangre: '',
    
  };

  fotoPorDefecto: string = 'assets/images/user_logo.png';
  fotoPreview: string | null = null;
  fotoFile: File | null = null;

  strfoto: string = '';          
  blSubirFoto: boolean = false;  

  
  strfotoBackend: string = '';    

  cargandoFotoEdit = false;      

  
  cedulaInvalida = false;
  personaExiste = false;
  personaEncontrada: any = null;
  buscandoCedula = false;
  private cedulaOriginal: string = '';

  
  celularInvalido = false;
  correoInvalido = false;

  
  detalleAbierto = false;
  personaDetalle: any = null;

  cargandoFotoDetalle = false;
  fotoDetalleUrl: string | null = null;

  constructor(
    private centralSrv: ServiciosWebCentral,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.obtenerPersonas();
  }

  
  
  
  obtenerPersonas(): void {
    this.cargando = true;

    this.centralSrv.ListadoPersonaTodos().subscribe({
      next: (resp: any) => {
        this.listaPersonas = resp?.datos ?? [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error ListadoPersonaTodos:', err);
        this.listaPersonas = [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  get personasFiltradas(): any[] {
    const f = (this.filtro || '').trim().toLowerCase();
    if (!f) return this.listaPersonas;

    return this.listaPersonas.filter((p: any) => {
      const nombres = (p.strnombres ?? p.persona_strnombres ?? '').toLowerCase();
      const apellidos = (p.strapellidos ?? p.persona_strapellidos ?? '').toLowerCase();
      const cedula = (p.strcedula ?? p.persona_strcedula ?? '').toLowerCase();
      const correo = (p.strcorreo1 ?? p.persona_strcorreo1 ?? '').toLowerCase();
      return nombres.includes(f) || apellidos.includes(f) || cedula.includes(f) || correo.includes(f);
    });
  }

  trackByPersona(index: number, item: any) {
    return item?.idpersona ?? item?.ouidpersona ?? index;
  }

  
  
  
  async crearNuevaPersona(): Promise<void> {
    this.modalModo = 'crear';
    this.resetFormularioPersona();
    this.resetValidaciones();
    this.quitarFoto();

    
    this.strfotoBackend = ''; 
    this.cedulaOriginal = '';
    this.modalAbierto = true;

    
    this.fotoPreview = this.fotoPorDefecto;
  }

  async editarPersona(p: any): Promise<void> {
    this.modalModo = 'editar';

    this.objPersona = {
      idpersona: p.idpersona ?? p.ouidpersona ?? null,
      strnombres: p.strnombres ?? p.persona_strnombres ?? '',
      strapellidos: p.strapellidos ?? p.persona_strapellidos ?? '',
      strcedula: p.strcedula ?? p.persona_strcedula ?? '',
      strcorreo1: p.strcorreo1 ?? p.persona_strcorreo1 ?? '',
      strcelular1: p.strcelular1 ?? p.persona_strcelular1 ?? '',
      strtiposangre: p.strtiposangre ?? p.persona_strtiposangre ?? '',
    };

    this.cedulaOriginal = this.objPersona.strcedula || '';
    this.resetValidaciones();
    this.quitarFoto();

    
    this.strfotoBackend = '';
    this.cargandoFotoEdit = true;
    this.fotoPreview = this.fotoPorDefecto;

    const idPersona = this.objPersona.idpersona;
    if (idPersona) {
      this.centralSrv.ObtenerPersonaFoto(idPersona).subscribe({
        next: (resp: any) => {
          const raw =
            resp?.datos?.[0]?.str_foto ??
            resp?.datos?.[0]?.strfoto ??
            resp?.datos?.[0]?.foto_base64 ??
            resp?.datos?.[0]?.foto ??
            '';

          
          this.strfotoBackend = raw ? ensureImageDataUrl(String(raw), 'image/jpeg') : '';
          
          this.fotoPreview = this.strfotoBackend || this.fotoPorDefecto;

          this.cargandoFotoEdit = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error ObtenerPersonaFoto (editar):', err);
          this.cargandoFotoEdit = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.cargandoFotoEdit = false;
    }

    this.modalAbierto = true;
    this.cdr.detectChanges();
  }

  cerrarModalPersona(): void {
    this.modalAbierto = false;
  }

  
  
  
  verDetallePersona(p: any): void {
    this.personaDetalle = p;
    this.detalleAbierto = true;

    this.fotoDetalleUrl = null;
    this.cargandoFotoDetalle = true;

    const idPersona = p.idpersona ?? p.ouidpersona;
    if (!idPersona) {
      this.cargandoFotoDetalle = false;
      return;
    }

    this.centralSrv.ObtenerPersonaFoto(idPersona).subscribe({
      next: (resp: any) => {
        const raw =
          resp?.datos?.[0]?.str_foto ??
          resp?.datos?.[0]?.strfoto ??
          resp?.datos?.[0]?.foto_base64 ??
          resp?.datos?.[0]?.foto ??
          '';

        this.fotoDetalleUrl = raw ? ensureImageDataUrl(String(raw), 'image/jpeg') : null;

        this.cargandoFotoDetalle = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error ObtenerPersonaFoto:', err);
        this.cargandoFotoDetalle = false;
        this.cdr.detectChanges();
      },
    });
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.personaDetalle = null;
    this.fotoDetalleUrl = null;
    this.cargandoFotoDetalle = false;
  }

  
  
  
  async onFotoSeleccionada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.fotoFile = file;

    const dataUrl = await fileToDataUrl(file);
    this.fotoPreview = dataUrl;

    this.strfoto = dataUrl;
    this.blSubirFoto = true;

    this.cdr.detectChanges();
  }

  quitarFoto(): void {
    this.fotoFile = null;
    
    this.strfoto = '';
    this.blSubirFoto = false;
  }

  
  
  
  private resetValidaciones(): void {
    this.cedulaInvalida = false;
    this.personaExiste = false;
    this.personaEncontrada = null;
    this.buscandoCedula = false;

    this.celularInvalido = false;
    this.correoInvalido = false;
  }

  onCedulaInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    const v = onlyDigitsMaxLen(input.value ?? '', 10);
    input.value = v;
    this.objPersona.strcedula = v;

    this.cedulaInvalida = false;
    this.personaExiste = false;
    this.personaEncontrada = null;

    if (v.length === 10) this.validarCedula();
  }

  validarCedulaAuto(): void {
    const ced = (this.objPersona.strcedula ?? '').trim();
    if (ced.length === 10) this.validarCedula();
  }

  validarCedula(): void {
    const ced = (this.objPersona.strcedula ?? '').trim();

    if (!/^\d{10}$/.test(ced)) {
      this.cedulaInvalida = true;
      return;
    }

    this.buscandoCedula = true;

    this.centralSrv.EncontrarPersonaDadoCedula(ced).subscribe({
      next: (resp: any) => {
        const encontrada = resp?.datos?.[0] ?? null;

        if (encontrada) {
          const idEncontrado = encontrada.idpersona ?? encontrada.ouidpersona ?? null;
          const idActual = this.objPersona.idpersona ?? null;

          if (this.modalModo === 'editar' && idActual && idEncontrado === idActual) {
            this.personaExiste = false;
            this.personaEncontrada = null;
          } else {
            this.personaExiste = true;
            this.personaEncontrada = encontrada;
          }
        } else {
          this.personaExiste = false;
          this.personaEncontrada = null;
        }

        this.buscandoCedula = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error EncontrarPersonaDadoCedula:', err);
        this.buscandoCedula = false;
        this.cdr.detectChanges();
      },
    });
  }

  onCelularInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    const v = onlyDigitsMaxLen(input.value ?? '', 10);
    input.value = v;
    this.objPersona.strcelular1 = v;

    this.celularInvalido = v.length > 0 && v.length !== 10;
  }

  validarCorreoAuto(): void {
    const correo = (this.objPersona.strcorreo1 ?? '').trim();
    this.correoInvalido = correo.length > 0 && !(correo.includes('@') && correo.includes('.'));
  }

  
  
  
  get disableGuardar(): boolean {
    const nombres = (this.objPersona.strnombres ?? '').trim();
    const apellidos = (this.objPersona.strapellidos ?? '').trim();
    const cedula = (this.objPersona.strcedula ?? '').trim();
    const correo = (this.objPersona.strcorreo1 ?? '').trim();
    const celular = (this.objPersona.strcelular1 ?? '').trim();
    const sangre = (this.objPersona.strtiposangre ?? '').trim();

    const cedulaOk = /^\d{10}$/.test(cedula);
    const celularOk = /^\d{10}$/.test(celular);
    const correoOk = correo.includes('@') && correo.includes('.');

    if (!(nombres && apellidos && cedulaOk && correoOk && celularOk && sangre)) return true;

    
    if (this.modalModo === 'crear' && this.personaExiste) return true;

    return false;
  }

  
  
  
  private buildObjPersonaParaBackend() {
    return {
      idpersona: this.objPersona.idpersona ?? null,
      strnombres: (this.objPersona.strnombres ?? '').trim(),
      strapellidos: (this.objPersona.strapellidos ?? '').trim(),
      strcedula: (this.objPersona.strcedula ?? '').trim(),
      strcorreo1: (this.objPersona.strcorreo1 ?? '').trim(),
      strcelular1: (this.objPersona.strcelular1 ?? '').trim(),
      strtiposangre: (this.objPersona.strtiposangre ?? '').trim(),
      dtfechamodificacion: new Date().toISOString(),
    };
  }

  private async resolveFotoParaGuardar(): Promise<string> {
    
    if (this.blSubirFoto && this.strfoto) return this.strfoto;

    
    if (this.modalModo === 'editar' && this.strfotoBackend) return this.strfotoBackend;

    
    
    return await urlToDataUrl(this.fotoPorDefecto);
  }

  async guardarPersona(): Promise<void> {
    if (this.disableGuardar) return;

    const objPersona = this.buildObjPersonaParaBackend();
    const fotoFinal = await this.resolveFotoParaGuardar();

    const payload = { ...objPersona, strfoto: fotoFinal };

    if (this.modalModo === 'crear') {
      this.centralSrv.IngresarPersonaFoto(payload).subscribe({
        next: () => {
          this.cerrarModalPersona();
          this.obtenerPersonas();
        },
        error: (err: any) => console.error('Error IngresarPersonaFoto:', err),
      });
      return;
    }

    
    this.centralSrv.ActualizarPersonaFoto(payload).subscribe({
      next: () => {
        this.cerrarModalPersona();
        this.obtenerPersonas();
      },
      error: (err: any) => console.error('Error ActualizarPersonaFoto:', err),
    });
  }

  private resetFormularioPersona(): void {
    this.objPersona = {
      idpersona: null,
      strnombres: '',
      strapellidos: '',
      strcedula: '',
      strcorreo1: '',
      strcelular1: '',
      strtiposangre: '',
    };
    this.fotoPreview = this.fotoPorDefecto;
    this.strfotoBackend = '';
  }

  
  
  

  mensajeEstado: string = '';
tipoMensajeEstado: 'success' | 'error' | '' = '';

toggleEstadoPersona(p: any): void {
  const idPersona = p.idpersona ?? p.ouidpersona;
  if (!idPersona) return;

  const estadoActual = (p.blestado ?? p.persona_blestado ?? p.activo) === true;
  const nuevoEstado = !estadoActual;

  
  const anterior = estadoActual;
  if (p.blestado !== undefined) p.blestado = nuevoEstado;
  else if (p.persona_blestado !== undefined) p.persona_blestado = nuevoEstado;
  else p.activo = nuevoEstado;

  this.centralSrv.ActualizarPersonaEstado(idPersona, nuevoEstado).subscribe({
    next: (resp) => {
      if (!resp?.success) {
        throw new Error('Respuesta inválida');
      }
    },
    error: (err) => {
      console.error('Error al actualizar estado', err);

      
      if (p.blestado !== undefined) p.blestado = anterior;
      else if (p.persona_blestado !== undefined) p.persona_blestado = anterior;
      else p.activo = anterior;
    },
  });
}

}
