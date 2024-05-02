import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpClient } from "@angular/common/http";
import { SessionUsuario } from '../../Models/session.model';
@Injectable({
  providedIn: 'root'
})
export class AuthUsuarioService {

  constructor(private http: HttpClient) { }


  iniciarSesion(email: string, contrasena: string): Observable<any> {

    const body = { correo: email, contrasena: contrasena };

    return this.http.post<any>(environment.url + "/api/iniciarSesion", body);

  }
  
  registrarUsuario(usuario: any): Observable<any> {

    return this.http.post<any>(environment.url + "/api/crear-usuario", usuario);

  }

  comprobarToken(dni: string, token_session: string): Observable<boolean> {

    const body = {dni: dni, token_session: token_session};
    
    return this.http.post<any>(environment.url + "/api/comprobarToken", body);
  }


  comprobarTokenContrasena(token: string, correo: string){
    const body = { token, correo };

    return this.http.post<any>(environment.url + "/api/comprobarTokenCorreo", body);
  }

  enviarCorreoCambioContrasena(correo: string){
    const body = { correo };

    return this.http.post<any>(environment.url + "/api/enviarCorreoCambioContrasena", body);
  }


  cambiarContrasena(token: string, correo: string, contrasena: string){
    const body = { token, correo, contrasena};
    return this.http.post<any>(environment.url + "/api/cambiarContrasena", body);
  }
}
