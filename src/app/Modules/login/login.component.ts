import { Component, input } from '@angular/core';
import { AuthUsuarioService } from '../../Core/Services/usuario/auth-usuario.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  email:string = "";
  contrasena:string = "";
  contrasenaMal:boolean = false;
  emailMal:boolean = false;
  mensajeErrorEmail:string = "";
  mensajeErrorContrasena:string = "";
  formatoCorrecto:boolean = true;

  comprobandoLogin:boolean = false;
  constructor(private authUsuario: AuthUsuarioService){}

  iniciarSesion(){
    
    this.resetearEstilos();
    this.comprobarFormatoLogin();
    if(this.formatoCorrecto){
      this.comprobandoLogin = true;
      this.authUsuario.iniciarSesion(this.email, this.contrasena).subscribe(
        (response) => {
         
          if(response['ok'] === 'ok'){
            alert("login correcto");
          }
          else{
            if(response['correo'] == 'correoIncorrecto'){
              this.emailIncorrecto();
              this.formatoCorrecto = false;
              this.mensajeErrorEmail = 'Correo incorrecto';
            }
            if(response['contrasena'] == 'contrasenaIncorrecta'){
              this.contrasenaIncorrecta();
              this.formatoCorrecto = false;
              this.mensajeErrorContrasena = 'Contraseña incorrecta';
            }
          }

          this.comprobandoLogin = false;
        }
        
      );
    }
      
  }

  

  contrasenaIncorrecta() {

    let inputContrasena = document.getElementById("password");
    if(inputContrasena != null) inputContrasena.style.border = "1px solid red";

    this.contrasenaMal = true;
    
  }

  emailIncorrecto(){

    let inputEmail = document.getElementById("email");
    if(inputEmail!= null) inputEmail.style.border = "1px solid red";
    this.emailMal = true;

  }

  resetearEstilos(){
    
    let inputContrasena = document.getElementById("password");
    if(inputContrasena != null) inputContrasena.style.border = "1px solid grey";
    let inputEmail = document.getElementById("email");
    if(inputEmail!= null) inputEmail.style.border = "1px solid grey";
    this.emailMal = false;
    this.contrasenaMal = false;
    this.formatoCorrecto = true;
  }

  comprobarFormatoLogin(){
   
    if(this.contrasena == ""){
      this.contrasenaIncorrecta();
      this.formatoCorrecto = false;
      this.mensajeErrorContrasena = "Introduzca una contraseña";
    }
    if(this.contrasena.length < 7){
      this.contrasenaIncorrecta();
      this.formatoCorrecto = false;
      this.mensajeErrorContrasena = "Introduzca una contraseña válida";
    }
    if(this.email == ""){
      this.emailIncorrecto();
      this.formatoCorrecto = false;
      this.mensajeErrorEmail= "Introduzca un email";
    }
    if (this.email.indexOf('@') == -1) {
      this.emailIncorrecto();
      this.formatoCorrecto = false;
      this.mensajeErrorEmail= "Introduzca un email correcto";
    }

    
  }
}
