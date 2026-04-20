import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlServicios } from './urlServiciosWeb.component';

@Injectable({
  providedIn: 'root',
})
export class ServiciosWebCentral {
  urlServiciosPCAElectricos: string = '';

  constructor(
    server: UrlServicios,
    private hpptclient: HttpClient
  ) {
    this.urlServiciosPCAElectricos = server.urlServicio;
  }


 ListadoPersonaTodos() {
   return this.hpptclient.get<any>(
     `${this.urlServiciosPCAElectricos}/rutapersonas/ListadoPersonaTodos`
   );
 }

EncontrarPersonaDadoCedula(cedula: string) {
  let headers = new HttpHeaders();
  headers = headers.append('Content-Type', 'application/json');

  return this.hpptclient.get<any>(
    `${this.urlServiciosPCAElectricos}/rutapersonas/EncontrarPersonaDadoCedula/${cedula}`,
    { headers }
  );
}

ObtenerPersonaFoto(idpersona: number) {
  let headers = new HttpHeaders();
  headers = headers.append('Content-Type', 'application/json');

  return this.hpptclient.get<any>(
    `${this.urlServiciosPCAElectricos}/rutapersonas/ObtenerPersonaFoto/${idpersona}`,
    { headers }
  );
}

IngresarPersona(objPersona: any) {
  let headers = new HttpHeaders();
  headers = headers.append('Content-Type', 'application/json');

  const body = { objPersona };

  return this.hpptclient.post<any>(
    `${this.urlServiciosPCAElectricos}/rutapersonas/IngresarPersona`,
    body,
    { headers }
  );
}

IngresarPersonaFoto(objPersona: any) {
  let headers = new HttpHeaders();
  headers = headers.append('Content-Type', 'application/json');

  const body = { objPersona };

  return this.hpptclient.post<any>(
    `${this.urlServiciosPCAElectricos}/rutapersonas/IngresarPersonaFoto`,
    body,
    { headers }
  );
}

ActualizarPersona(objPersona: any) {
  let headers = new HttpHeaders();
  headers = headers.append('Content-Type', 'application/json');

  const body = { objPersona };

  return this.hpptclient.put<any>(
    `${this.urlServiciosPCAElectricos}/rutapersonas/ActualizarPersona`,
    body,
    { headers }
  );
}

ActualizarPersonaFoto(objPersona: any) {
  let headers = new HttpHeaders();
  headers = headers.append('Content-Type', 'application/json');

  const body = { objPersona };

  return this.hpptclient.put<any>(
    `${this.urlServiciosPCAElectricos}/rutapersonas/ActualizarPersonaFoto`,
    body,
    { headers }
  );
}


ActualizarPersonaEstado(idPersona: number, blEstado: boolean) {
  return this.hpptclient.get<any>(
    `${this.urlServiciosPCAElectricos}/rutapersonas/ActualizarPersonaEstado/${idPersona}/${blEstado}`
  );
}


ListadoTurnoTodos() {
  return this.hpptclient.get<any>(
    `${this.urlServiciosPCAElectricos}/rutaturno/ListadoTurnoTodos`
  );
}

CrearTurno(objTurno: any) {
  let headers = new HttpHeaders();
  headers = headers.append('Content-Type', 'application/json');
  return this.hpptclient.post<any>(
    `${this.urlServiciosPCAElectricos}/rutaturno/CrearTurno`,
    { objTurno },
    { headers }
  );
}

ActualizarTurno(objTurno: any) {
  let headers = new HttpHeaders();
  headers = headers.append('Content-Type', 'application/json');
  return this.hpptclient.put<any>(
    `${this.urlServiciosPCAElectricos}/rutaturno/ActualizarTurno`,
    { objTurno },
    { headers }
  );
}

ActualizarTurnoEstado(idTurno: number, blEstado: boolean) {
  return this.hpptclient.put<any>(
    `${this.urlServiciosPCAElectricos}/rutaturno/ActualizarTurnoEstado/${idTurno}/${blEstado}`,
    {}
  );
}

}
