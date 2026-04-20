import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UrlServicios } from './urlServiciosWeb.component';

@Injectable({
  providedIn: 'root',
})
export class ServiciosWebSeguridad {
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

  
  
  
  private jsonHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    return headers;
  }

  
  
  
  Login(usuario: string, password: string) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutalogin/Login/${usuario}/${password}`
    );
  }

  LoginApp(usuario: string, password: string, appType: string) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutalogin/LoginApp/${usuario}/${password}/${appType}`
    );
  }

  EncriptarToken(token: string) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutalogin/EncriptarToken/${token}`
    );
  }

  DesencriptarToken(token: string) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutalogin/DesencriptarToken/${token}`
    );
  }

  
  
  
  RolesUsuario(idUsuario: number) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutausuario/RolesUsuario/${idUsuario}`
    );
  }

  
  
  
  ListadoRolTodos() {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutarol/ListadoRolTodos`
    );
  }

  ObtenerTurnosTecnicosHoy() {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutatecnicoturno/ObtenerTurnosTecnicosHoy`
    );
  }

  ObtenerTurnosTecnico(idusuario: number) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutatecnicoturno/ObtenerTurnosTecnico/${idusuario}`
    );
  }

  GuardarTurnosTecnico(idusuario: number, dias: { fecha: string; tipo: string }[]) {
    const headers = this.jsonHeaders();
    return this.hpptclient.post<any>(
      `${this.urlServiciosPCAElectricos}/rutatecnicoturno/GuardarTurnosTecnico`,
      { idusuario, dias },
      { headers }
    );
  }

    ListadoRolActivos() {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutarol/ListadoRolActivos`
    );
  }

  CrearRol(objRol: any) {
    const headers = this.jsonHeaders();
    const body = { objRol };

    return this.hpptclient.post<any>(
      `${this.urlServiciosPCAElectricos}/rutarol/CrearRol`,
      body,
      { headers }
    );
  }

  ActualizarRol(objRol: any) {
    const headers = this.jsonHeaders();
    const body = { objRol };

    return this.hpptclient.put<any>(
      `${this.urlServiciosPCAElectricos}/rutarol/ActualizarRol`,
      body,
      { headers }
    );
  }

  ActualizarRolEstado(idRol: number, blEstado: boolean) {
    const headers = this.jsonHeaders();

    return this.hpptclient.put<any>(
      `${this.urlServiciosPCAElectricos}/rutarol/ActualizarRolEstado/${idRol}/${blEstado}`,
      {},
      { headers }
    );
  }

  ObtenerRolDadoId(idRol: number) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutarol/ObtenerRolDadoId/${idRol}`
    );
  }

  EliminarRegistroRol(idRol: number) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutarol/EliminarRegistroRol/${idRol}`
    );
  }

  
  
  
  ListadoUsuarioTodos() {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutausuario/ListadoUsuarioTodos`
    );
  }

  ListadoUsuarioPersonaTodos() {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutausuario/ListadoUsuarioPersonaTodos`
    );
  }
  

GuardarUsuarioPersona(payload: any) {
  const headers = this.jsonHeaders();
  return this.hpptclient.post<any>(
    `${this.urlServiciosPCAElectricos}/rutausuario/CrearUsuario`,
    payload,
    { headers }
  );
}



  ActualizarUsuario(objUsuario: any) {
    const headers = this.jsonHeaders();
    const body = { objUsuario };

    return this.hpptclient.put<any>(
      `${this.urlServiciosPCAElectricos}/rutausuario/ActualizarUsuario`,
      body,
      { headers }
    );
  }

  ActualizarUsuarioCompleto(payload: any) {
    const headers = this.jsonHeaders();
    return this.hpptclient.put<any>(
      `${this.urlServiciosPCAElectricos}/rutausuario/ActualizarUsuarioCompleto`,
      payload,
      { headers }
    );
  }

  ActualizarUsuarioEstado(idUsuario: number, blEstado: boolean) {
    const headers = this.jsonHeaders();

    return this.hpptclient.put<any>(
      `${this.urlServiciosPCAElectricos}/rutausuario/ActualizarUsuarioEstado/${idUsuario}/${blEstado}`,
      {},
      { headers }
    );
  }

  ObtenerUsuarioDadoId(idUsuario: number) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutausuario/ObtenerUsuarioDadoId/${idUsuario}`
    );
  }

  ObtenerUsuarioDadoNombreUsuario(nombreUsuario: string) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutausuario/ObtenerUsuarioDadoNombreUsuario/${nombreUsuario}`
    );
  }

  ObtenerUsuarioDadoCorreoUsuario(correoUsuario: string) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutausuario/ObtenerUsuarioDadoCorreoUsuario/${correoUsuario}`
    );
  }

  
  
  
  ListadoPerfilTodos() {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutaperfil/ListadoPerfilTodos`
    );
  }

  ListadoPerfilUsuarioRoles(idUsuario: number) {
    return this.hpptclient.get<any>(
      `${this.urlServiciosPCAElectricos}/rutaperfil/ListadoPerfilUsuarioRoles/${idUsuario}`
    );
  }

  CrearPerfil(objPerfil: any) {
    const headers = this.jsonHeaders();
    const body = { objPerfil };

    return this.hpptclient.post<any>(
      `${this.urlServiciosPCAElectricos}/rutaperfil/CrearPerfil`,
      body,
      { headers }
    );
  }

  ActualizarPerfilEstado(objPerfil: any) {
    const headers = this.jsonHeaders();
    const body = { objPerfil };

    return this.hpptclient.put<any>(
      `${this.urlServiciosPCAElectricos}/rutaperfil/ActualizarPerfilEstado`,
      body,
      { headers }
    );
  }

  
  
  
  RecuperarPassword(objRecuperacion: any) {
    const headers = this.jsonHeaders();
    const body = { objRecuperacion };

    return this.hpptclient.post<any>(
      `${this.urlServiciosPCAElectricos}/rutarecuperarpassword/recuperarPassword`,
      body,
      { headers }
    );
  }
}
