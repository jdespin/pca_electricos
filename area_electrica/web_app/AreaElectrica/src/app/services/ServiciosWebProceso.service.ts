import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlServicios } from './urlServiciosWeb.component';

@Injectable({
  providedIn: 'root',
})
export class ServiciosWebProceso {
  urlServiciosPCAElectricos: string = '';
  user: any;
  authToken: any;

  constructor(
    private http: HttpClient,
    server: UrlServicios,
    private hpptclient: HttpClient
  ) {
    this.urlServiciosPCAElectricos = server.urlServicio;
  }


  ListadoDisponibilidadActivos() {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutadisponibilidad/ListadoDisponibilidadActivos`
    );
  }

  ListadoTiposPruebaActivos() {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutatipoprueba/ListadoTipoPruebaActivos`
    );
  }

  ListadoEquiposInternos() {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutaequipointerno/ListadoEquiposInternos`
    );
  }


  IngresarEquipoInternoCertificado(objEquipo: any, objCertificado: any) {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');

    const body = { objEquipo, objCertificado };

    return this.hpptclient.post<any>(
      `${this.urlServiciosPCAElectricos}/rutaequipointerno/IngresarEquipoInternoCertificado`,
      body,
      { headers }
    );
  }

  ListadoTipoEquipoActivo() {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutatipoequipo/ListadoTipoEquipoActivo`
    );
  }

  ListadoEquiposExternos() {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutaequipoexterno/ListadoEquiposExternos`
    );
  }

  VerificarIdentificadorEquipoExterno(stridentificador: string) {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');

    const body = { stridentificador };

    return this.hpptclient.post<any>(
      `${this.urlServiciosPCAElectricos}/rutaequipoexterno/VerificarIdentificadorEquipoExterno`,
      body,
      { headers }
    );
  }

  IngresarEquipoExterno(objEquipo: any) {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');

    const body = { objEquipo };

    return this.hpptclient.post<any>(
      `${this.urlServiciosPCAElectricos}/rutaequipoexterno/IngresarEquipoExterno`,
      body,
      { headers }
    );
  }

  EquipoExternoIdentificador(identificador: string) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutaequipoexterno/EquipoExternoIdentificador/${encodeURIComponent(identificador)}`
    );
  }

    EquipoInternoPorPrueba(identificador: number) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutaequipointerno/ListadoEquipoPorPrueba/${encodeURIComponent(identificador)}`
    );
  }

  ReporteUsoEquipo(desde: string | null, hasta: string | null) {
    const params: string[] = [];
    if (desde) params.push(`desde=${encodeURIComponent(desde)}`);
    if (hasta) params.push(`hasta=${encodeURIComponent(hasta)}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutaequipointerno/ReporteUsoEquipo${qs}`
    );
  }

  ToggleEstadoEquipo(idequipointerno: number, blestado: boolean) {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    return this.hpptclient.post<any>(
      `${this.urlServiciosPCAElectricos}/rutaequipointerno/ToggleEstadoEquipo`,
      { idequipointerno, blestado },
      { headers }
    );
  }

  CambiarDisponibilidadEquipo(idequipointerno: number, strdisponibilidad: string) {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    return this.hpptclient.post<any>(
      `${this.urlServiciosPCAElectricos}/rutaequipointerno/CambiarDisponibilidad`,
      { idequipointerno, strdisponibilidad },
      { headers }
    );
  }

  CrearOrden(objOrden: any) {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    return this.hpptclient.post<any>(
      `${this.urlServiciosPCAElectricos}/rutaorden/CrearOrden`,
      { objOrden },
      { headers }
    );
  }

  ListarOrdenes(estado?: string) {
    const path = estado
      ? `/rutaorden/ListarOrdenes/${encodeURIComponent(estado)}`
      : '/rutaorden/ListarOrdenes';
    return this.hpptclient.get<any>(`${this.urlServiciosPCAElectricos}${path}`);
  }

  DetalleOrden(idorden: number) {
    return this.hpptclient.get<any>(`${this.urlServiciosPCAElectricos}/rutaorden/DetalleOrden/${idorden}`);
  }

  CambiarEstadoOrden(idorden: number, nuevoEstado: string) {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    return this.hpptclient.put<any>(
      `${this.urlServiciosPCAElectricos}/rutaorden/CambiarEstado/${idorden}`,
      { nuevoEstado },
      { headers }
    );
  }

  EvaluarOrden(idorden: number, calificacion: string, observacion: string = '') {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    return this.hpptclient.put<any>(
      `${this.urlServiciosPCAElectricos}/rutaorden/CambiarEstado/${idorden}`,
      { nuevoEstado: 'evaluada', calificacion, observacion },
      { headers }
    );
  }

  EliminarOrden(idorden: number) {
    return this.hpptclient.delete<any>(`${this.urlServiciosPCAElectricos}/rutaorden/EliminarOrden/${idorden}`);
  }

  ActualizarOrden(idorden: number, objOrden: any) {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    return this.hpptclient.put<any>(
      `${this.urlServiciosPCAElectricos}/rutaorden/ActualizarOrden/${idorden}`,
      { objOrden },
      { headers }
    );
  }

  

  ListarReportesTecnicos() {
    return this.hpptclient.get<any>(`${this.urlServiciosPCAElectricos}/rutareportetecnico/ListarReportes`);
  }

  DetalleReporteTecnico(idorden: number) {
    return this.hpptclient.get<any>(`${this.urlServiciosPCAElectricos}/rutareportetecnico/DetalleReporte/${idorden}`);
  }

  FotoEquipo(idfotoequipo: number) {
    return this.hpptclient.get<any>(`${this.urlServiciosPCAElectricos}/rutareportetecnico/FotoEquipo/${idfotoequipo}`);
  }

  DescargarPDFReporte(idorden: number) {
    return this.hpptclient.get(
      `${this.urlServiciosPCAElectricos}/rutareportetecnico/GenerarPDF/${idorden}`,
      { responseType: 'blob' }
    );
  }

  DescargarFotosZIP(idorden: number) {
    return this.hpptclient.get(
      `${this.urlServiciosPCAElectricos}/rutareportetecnico/DescargarFotosZIP/${idorden}`,
      { responseType: 'blob' }
    );
  }



  ObtenerNotificaciones(idUsuario: number) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutanotificacion/NotificacionesUsuario/${idUsuario}`
    );
  }

  MarcarNotificacionLeida(idnotificacion: number) {
    return this.hpptclient.put<any>(
      `${this.urlServiciosPCAElectricos}/rutanotificacion/MarcarLeida/${idnotificacion}`,
      {}
    );
  }

  MarcarTodasNotificacionesLeidas(idUsuario: number) {
    return this.hpptclient.put<any>(
      `${this.urlServiciosPCAElectricos}/rutanotificacion/MarcarTodasLeidas/${idUsuario}`,
      {}
    );
  }
}
