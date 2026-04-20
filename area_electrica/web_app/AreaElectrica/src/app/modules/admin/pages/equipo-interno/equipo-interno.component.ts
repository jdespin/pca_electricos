import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ServiciosWebProceso } from '../../../../services/ServiciosWebProceso.service';

type ModalModo = 'crear' | 'editar';

interface Categoria {
  id: string;
  label: string;
  keywords: string[];
}

@Component({
  selector: 'app-equipo-interno',
  imports: [CommonModule, FormsModule],
  templateUrl: './equipo-interno.component.html',
  styleUrl: './equipo-interno.component.css',
})
export class EquipoInternoComponent implements OnInit {

  listaEquipos: any[] = [];

  archivoCertificadoBase64: string | null = null;
  archivoCertificadoNombre = '';
  archivoImagenBase64: string | null = null;
  archivoImagenDataUrl: string | null = null;
  archivoImagenNombre = '';
  tipoCustom = '';

  cargando = false;
  filtro = '';

  readonly categorias: Categoria[] = [
    { id: 'ttr',      label: 'TTR',                 keywords: ['ttr'] },
    { id: 'microohm', label: 'Micro Ohm',           keywords: ['micro', 'ohm'] },
    { id: 'megger',   label: 'Megger',              keywords: ['megger'] },
    { id: 'rigidez',  label: 'Rigidez Dieléctrica', keywords: ['rigidez'] },
    { id: 'factor',   label: 'Factor de Potencia',  keywords: ['factor'] },
  ];
  categoriaActiva = 'todas';

  get categoriaLabel(): string {
    return this.categorias.find(c => c.id === this.categoriaActiva)?.label ?? 'Todos';
  }

  get equiposFiltrados(): any[] {
    const f = (this.filtro ?? '').trim().toLowerCase();
    if (!f) return this.listaEquipos;

    return this.listaEquipos.filter(e =>
      (e.strequipo ?? '').toLowerCase().includes(f) ||
      (e.strserie  ?? '').toLowerCase().includes(f) ||
      (e.strmarca  ?? '').toLowerCase().includes(f) ||
      (e.strmodelo ?? '').toLowerCase().includes(f)
    );
  }

  get tiposPersonalizados(): string[] {
    const labelsFixos = new Set(this.categorias.map(c => c.label));
    const vistos = new Set<string>();
    for (const e of this.listaEquipos) {
      const tipo = (e.strequipo ?? '').trim();
      if (tipo && !labelsFixos.has(tipo)) vistos.add(tipo);
    }
    return Array.from(vistos).sort();
  }

  private get strequipoEfectivo(): string {
    return this.objEquipo.strequipo === '__otro__'
      ? this.tipoCustom.trim()
      : (this.objEquipo.strequipo ?? '').trim();
  }

  objEquipo: any = {
    idequipoint: null,
    strequipo: '',
    strserie: '',
    strmarca: '',
    strmodelo: '',
    strdescripcion: '',
    strdisponibilidad: 'Libre',
    strimagen: '',
  };

  objCertificado: any = {
    idcertificado: null,
    idequipointerno: null,
    strcertificado: '',
    dtfechaemision: null,
    dtfechavencimiento: null,
    strdescripcion: '',
  };

  disableGuardar = false;

  modalAbierto = false;
  modalModo: ModalModo = 'crear';

  detalleAbierto = false;
  equipoDetalle: any = null;

  private _pendingVerEquipo: number | null = null;

  mensajeEstado = '';
  tipoMensajeEstado: 'success' | 'error' | '' = '';

  toastMensaje = '';
  toastTipo: 'success' | 'error' | '' = '';
  private toastTimer: any = null;

  constructor(
    private procesoSrv: ServiciosWebProceso,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const categoria = params.get('categoria');
      if (categoria) {
        const valido = this.categorias.find(c => c.id === categoria);
        this.categoriaActiva = valido ? categoria : 'todas';
      } else {
        this.categoriaActiva = 'todas';
      }
      this.cdr.detectChanges();
    });

    this.route.queryParamMap.subscribe(params => {
      const id = params.get('verEquipo');
      if (id) {
        this._pendingVerEquipo = parseInt(id, 10);
        const equipo = this.listaEquipos.find(
          e => (e.idequipointerno ?? e.idequipoint) === this._pendingVerEquipo
        );
        if (equipo) {
          this.verDetalleEquipo(equipo);
          this._pendingVerEquipo = null;
        }
      }
    });

    this.listaEquiposInternos();
  }

  private setCargando(valor: boolean): void {
    this.cargando = valor;
    this.cdr.detectChanges();
  }

  listaEquiposInternos(): void {
    this.setCargando(true);
    this.procesoSrv.ListadoEquiposInternos?.().subscribe({
      next: (resp: any) => {
        this.listaEquipos = resp?.datos ?? [];
        this.setCargando(false);
        if (this._pendingVerEquipo !== null) {
          const equipo = this.listaEquipos.find(
            e => (e.idequipointerno ?? e.idequipoint) === this._pendingVerEquipo
          );
          if (equipo) this.verDetalleEquipo(equipo);
          this._pendingVerEquipo = null;
        }
      },
      error: (err: any) => {
        console.error('Error ListadoEquiposInternos:', err);
        this.listaEquipos = [];
        this.setCargando(false);
      },
    });
  }

  trackByEquipo(index: number, item: any) {
    return item?.idequipoint ?? item?.idequipointerno ?? index;
  }

  crearNuevoEquipo(): void {
    this.modalModo = 'crear';
    this.modalAbierto = true;
    this.mensajeEstado = '';
    this.tipoMensajeEstado = '';
    this.disableGuardar = false;
    this.archivoCertificadoBase64 = null;
    this.archivoCertificadoNombre = '';
    this.archivoImagenBase64 = null;
    this.archivoImagenDataUrl = null;
    this.archivoImagenNombre = '';
    this.tipoCustom = '';

    this.objEquipo = {
      idequipoint: null,
      strequipo: '',
      strserie: '',
      strmarca: '',
      strmodelo: '',
      strdescripcion: '',
      strdisponibilidad: 'Libre',
      strimagen: '',
    };

    this.objCertificado = {
      idcertificado: null,
      idequipointerno: null,
      strcertificado: '',
      dtfechaemision: null,
      dtfechavencimiento: null,
      strdescripcion: '',
    };
  }

  cerrarModalEquipo(): void {
    this.modalAbierto = false;
  }

  editarEquipo(p: any): void {
    this.modalModo = 'editar';
    this.modalAbierto = true;
    this.mensajeEstado = '';
    this.tipoMensajeEstado = '';
    this.disableGuardar = false;
    this.archivoCertificadoBase64 = null;
    this.archivoCertificadoNombre = '';
    this.archivoImagenBase64 = null;
    this.archivoImagenDataUrl = null;
    this.archivoImagenNombre = '';
    this.tipoCustom = '';

    const strequipoActual = p.strequipo ?? '';
    const esCategoria = this.categorias.some(c => c.label === strequipoActual);
    const strequipoSelect = esCategoria ? strequipoActual : (strequipoActual ? '__otro__' : '');
    if (!esCategoria && strequipoActual) this.tipoCustom = strequipoActual;

    const dispActual = (p.strdisponibilidad ?? '').toLowerCase();
    const strdisponibilidad = dispActual.includes('ocup') ? 'Ocupado'
      : dispActual.includes('mant') ? 'Mantenimiento' : 'Libre';

    this.objEquipo = {
      idequipoint: p.idequipointerno ?? p.idequipoint ?? null,
      strequipo: strequipoSelect,
      strserie: p.strserie ?? '',
      strmarca: p.strmarca ?? '',
      strmodelo: p.strmodelo ?? '',
      strdescripcion: p.strdescripcion ?? '',
      strdisponibilidad,
      strimagen: p.strimagen ?? '',
      blestado: p.blestado ?? true,
    };

    this.objCertificado = {
      idcertificado: p.idcertificado ?? null,
      idequipointerno: p.idequipointerno ?? p.idequipoint ?? null,
      strcertificado: p.strcertificado ?? '',
      dtfechaemision: this.formatearFechaParaInputDate(p.dtfechaemision),
      dtfechavencimiento: this.formatearFechaParaInputDate(p.dtfechavencimiento),
      strdescripcion: p.strdescripcion_cert ?? p.strdescripcion_certificado ?? '',
    };
  }

  guardarEquipo(): void {
    this.mensajeEstado = '';
    this.tipoMensajeEstado = '';

    const errorValidacion = this.obtenerErrorValidacion();
    if (errorValidacion) {
      this.mensajeEstado = errorValidacion;
      this.tipoMensajeEstado = 'error';
      return;
    }

    this.disableGuardar = true;

    const objEquipoPayload: any = {
      ...this.objEquipo,
      strequipo: this.strequipoEfectivo,
      idtipoprueba: null,
      strdisponibilidad: 'Libre',
      archivoImagen: this.archivoImagenBase64
        ? { base64: this.archivoImagenBase64, nombre: this.archivoImagenNombre }
        : null,
    };

    const objCertificadoPayload = {
      ...this.objCertificado,
      dtfechaemision: this.formatearFechaParaBD(this.objCertificado.dtfechaemision),
      dtfechavencimiento: this.formatearFechaParaBD(this.objCertificado.dtfechavencimiento),
      archivoPDF: this.archivoCertificadoBase64
        ? { base64: this.archivoCertificadoBase64, nombre: this.archivoCertificadoNombre }
        : null,
    };

    this.procesoSrv.IngresarEquipoInternoCertificado(objEquipoPayload, objCertificadoPayload)
      .subscribe({
        next: (resp: any) => {
          if (resp?.success === false) {
            this.mensajeEstado = resp?.error || (this.modalModo === 'crear'
              ? 'Ocurrió un error al guardar.'
              : 'Ocurrió un error al actualizar.');
            this.tipoMensajeEstado = 'error';
            this.disableGuardar = false;
            return;
          }

          this.mensajeEstado = this.modalModo === 'crear'
            ? 'El equipo y su certificado se guardaron correctamente.'
            : 'El equipo y su certificado se actualizaron correctamente.';
          this.tipoMensajeEstado = 'success';

          setTimeout(() => {
            this.cerrarModalEquipo();
            this.listaEquiposInternos();
          }, 800);
        },
        error: (err: any) => {
          console.error('Error guardando equipo/certificado:', err);
          this.mensajeEstado = 'Error de conexión con el servidor.';
          this.tipoMensajeEstado = 'error';
          this.disableGuardar = false;
        },
      });
  }

  private obtenerErrorValidacion(): string {
    if (this.modalModo === 'crear') {
      if (!this.strequipoEfectivo)                return this.objEquipo.strequipo === '__otro__'
        ? 'Ingresa el nombre del tipo de equipo.'
        : 'Selecciona el tipo de equipo.';
      if (!this.objEquipo?.strserie?.trim())       return 'El número de serie es obligatorio.';
      if (!this.objEquipo?.strmarca?.trim())       return 'La marca es obligatoria.';
      if (!this.objEquipo?.strmodelo?.trim())      return 'El modelo es obligatorio.';
      if (!this.archivoCertificadoBase64)          return 'Debes subir el archivo PDF del certificado de calibración.';
    }

    if (!this.objCertificado?.dtfechaemision)      return 'La fecha de emisión es obligatoria.';
    if (!this.objCertificado?.dtfechavencimiento)  return 'La fecha de vencimiento es obligatoria.';

    const emision = new Date(this.objCertificado.dtfechaemision);
    const venc    = new Date(this.objCertificado.dtfechavencimiento);
    if (isNaN(emision.getTime()) || isNaN(venc.getTime())) return 'Las fechas ingresadas no son válidas.';
    if (venc < emision) return 'La fecha de vencimiento debe ser posterior a la de emisión.';

    return '';
  }

  onPDFSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.archivoCertificadoBase64 = result.split(',')[1];
      this.archivoCertificadoNombre = file.name;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  limpiarPDF(): void {
    this.archivoCertificadoBase64 = null;
    this.archivoCertificadoNombre = '';
  }

  onImagenSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.archivoImagenDataUrl = result;
      this.archivoImagenBase64 = result.split(',')[1];
      this.archivoImagenNombre = file.name;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  limpiarImagen(): void {
    this.archivoImagenBase64 = null;
    this.archivoImagenDataUrl = null;
    this.archivoImagenNombre = '';
  }

  convertirANumeroONulo(valor: any): number | null {
    if (valor === null || valor === undefined || valor === '') return null;
    const n = Number(valor);
    return isNaN(n) ? null : n;
  }

  formatearFechaParaBD(valor: any): string | null {
    if (!valor) return null;
    if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
    const d = new Date(valor);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  formatearFechaParaInputDate(valor: any): string | null {
    return this.formatearFechaParaBD(valor);
  }

  verDetalleEquipo(p: any): void {
    this.equipoDetalle = p;
    this.detalleAbierto = true;
  }

  cerrarDetalle(): void {
    this.detalleAbierto = false;
    this.equipoDetalle = null;
  }

  private mostrarToast(mensaje: string, tipo: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMensaje = mensaje;
    this.toastTipo = tipo;
    this.cdr.detectChanges();
    this.toastTimer = setTimeout(() => {
      this.toastMensaje = '';
      this.toastTipo = '';
      this.cdr.detectChanges();
    }, 4500);
  }

  toggleEstadoEquipo(p: any): void {
    const nuevoEstado = !Boolean(p.blestado ?? p.activo);
    const idequipointerno = p.idequipointerno ?? p.idequipoint;

    this.procesoSrv.ToggleEstadoEquipo(idequipointerno, nuevoEstado).subscribe({
      next: (resp: any) => {
        if (resp?.success === false) {
          this.mostrarToast(resp.mensaje ?? 'No se puede cambiar el estado del equipo.', 'error');
          return;
        }
        if ('blestado' in p) p.blestado = nuevoEstado;
        else p.activo = nuevoEstado;
        this.cdr.detectChanges();
      },
      error: () => this.mostrarToast('Error de conexión al cambiar el estado.', 'error'),
    });
  }

  esOcupado(p: any): boolean {
    return (p.strdisponibilidad ?? '').toLowerCase().includes('ocup');
  }

  cambiarDisponibilidad(p: any): void {
    if (this.esOcupado(p)) {
      this.mostrarToast('No puede cambiar el estado de un equipo que está siendo utilizado por un técnico.', 'error');
      return;
    }

    const actual = (p.strdisponibilidad ?? '').toLowerCase();
    const nuevo  = actual.includes('mant') ? 'Libre' : 'Mantenimiento';

    const idequipointerno = p.idequipointerno ?? p.idequipoint;
    this.procesoSrv.CambiarDisponibilidadEquipo(idequipointerno, nuevo).subscribe({
      next: (resp: any) => {
        if (resp?.success === false) {
          this.mostrarToast(resp.mensaje ?? 'No se pudo cambiar la disponibilidad.', 'error');
          return;
        }
        p.strdisponibilidad = nuevo;
        if (nuevo === 'Mantenimiento') {
          p.blestado = false;
        }
        if (nuevo === 'Libre') {
          p.strnombretecnico = null;
          p.dtfechainicio = null;
        }
        this.cdr.detectChanges();
      },
      error: () => this.mostrarToast('Error de conexión al cambiar disponibilidad.', 'error'),
    });
  }

  disponibilidadAccion(p: any): string {
    if (this.esOcupado(p)) return 'En uso por técnico — bloqueado';
    const d = (p.strdisponibilidad ?? '').toLowerCase();
    if (d.includes('mant')) return 'Marcar como Libre';
    return 'Enviar a Mantenimiento';
  }

  diasHastaVencimiento(fecha: any): number {
    if (!fecha) return 9999;
    const venc = new Date(fecha);
    const hoy  = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  esPDF(strcertificado: any): boolean {
    return typeof strcertificado === 'string' && strcertificado.toLowerCase().endsWith('.pdf');
  }

  descargarCertificado(p: any): void {
    if (!this.esPDF(p.strcertificado)) return;
    const url = `http://localhost:3001/wselectricos/certificados/${p.strcertificado}`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = p.strcertificado;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      })
      .catch(() => window.open(url, '_blank'));
  }
}
