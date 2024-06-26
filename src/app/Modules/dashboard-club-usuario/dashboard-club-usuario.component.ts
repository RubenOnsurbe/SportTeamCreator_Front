/* Componente TS con todas las funcionalidades para la gestión del usuario */
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Import ActivatedRoute
import { obtenerSessionUsuario } from '../../shared/guardarSessionUsuario/guardarSessionUsuario';
import { SessionUsuario } from '../../Core/Models/session.model';
import { ClubControllerService } from '../../Core/Services/club/club-controller.service';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { CompartidoService } from './compartido.service';
import { MatDialog } from '@angular/material/dialog';
import { PopUpCrearEventoComponent } from './pop-up-crear-evento/pop-up-crear-evento.component';
import { PopUpDetallesEventoComponent } from './pop-up-detalles-evento/pop-up-detalles-evento.component';
import { ToastrService } from 'ngx-toastr';
import { PopUpCrearEquipoComponent } from './pop-up-crear-equipo/pop-up-crear-equipo.component';
import { Equipo } from '../../Core/Models/equipo.model'; // Import Equipo
import { Observable, forkJoin } from 'rxjs';
import { InfoUsuarioService } from '../../Core/Services/usuario/info-usuario.service';
import { PopUpEditarEquipoComponent } from './pop-up-editar-equipo/pop-up-editar-equipo.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { co } from '@fullcalendar/core/internal-common';




@Component({
  selector: 'app-dashboard-club-usuario',
  templateUrl: './dashboard-club-usuario.component.html',
  styleUrl: './dashboard-club-usuario.component.css'
})
export class DashboardClubUsuarioComponent {
  calendario: boolean = true;
  jugadoresClub: boolean = false;
  equiposClub: boolean = false;
  ajustesClub: boolean = false;
  mostrarEquipos: boolean = false;
  usuarioLogeado: SessionUsuario;
  id_club: number | null = null;
  nombreClub: string = "";
  codigoAcceso: string = "";
  localizacion: string = "";
  rol: string = "";
  jugadores: any[] = [];
  nombre: string = "";
  nombreEvento: string = "";
  fechaInicio: string = "";
  fechaFin: string = "";
  descripcion: string = "";
  admin: boolean = true;
  tipoEventoSeleccionado: string = 'todos';
  visible: string = 'ajustes';
  equipos: Equipo[] = [];
  showLoader: boolean = true;

  constructor(private route: ActivatedRoute,
    private clubService: ClubControllerService,
    private compartido: CompartidoService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private router: Router,
    private http: HttpClient) {
    this.usuarioLogeado = obtenerSessionUsuario();
    // Extract the clubId from the query parameters
    this.route.queryParams.subscribe(params => {
      const clubId = params['clubId'];
      const clubName = params['nombreClub'];
      if (clubId) {
        this.id_club = Number(clubId);
        this.nombreClub = clubName;
      }
    });

    this.comprobarClubYUsuario();

  }

  private comprobarClubYUsuario(): void {

    this.clubService.comprobarUsuarioPerteneceClub(this.usuarioLogeado.dni, this.id_club).subscribe(
      (response) => {
        if (!response) this.router.navigate(['/dashboard']);
      }
    );
  }
  ngOnInit(): void {

    this.sacarRoles(); // Llama a sacarRoles() primero
    this.compartido.mostrarEquipos$.subscribe(value => {

      this.mostrarEquipos = value;
      console.log(this.mostrarEquipos);

    });
    this.eventosDeClub();

  }
  sacarRoles() {
    this.clubService.obtenerRolesUsuario({ dni: this.usuarioLogeado, id_club: this.id_club }).subscribe({
      next: (res: any) => {
        this.rol = res;
        this.esAdmin();
      },
      error: (err) => {
        console.error('Error fetching clubs:', err);
      }
    });


  }


  eventosDeClub() {
    this.compartido.obtenerEventosDeClub({ id_club: this.id_club, tipo: this.tipoEventoSeleccionado }).subscribe(
      (response) => {
        this.calendarOptions.events = response.map((evento: { titulo: any; fechaInicio: any; fechaFin: any; descripcion: any; ubicacion: any; tipo: any; id: any }) => ({
          id: evento.id,
          title: evento.titulo,
          start: evento.fechaInicio,
          end: evento.fechaFin,
          description: evento.descripcion,
          location: evento.ubicacion,
          type: evento.tipo
        }));

      },
      (error) => {
        console.error("Hubo un error al intentar obtener los eventos del usuario:", error);
      }
    );
  }

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin],
    firstDay: 1,
    events: [
      { title: 'Cumple Ruben', date: '2024-04-14' }
    ],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,dayGridWeek,dayGridDay'
    },
    locale: 'es',
    buttonText: { today: "Hoy", dayGridMonth: 'Mes', dayGridWeek: 'Semana', dayGridDay: "Día" }, // Establece el texto del botón "Hoy" en español

    windowResize: function (arg) {
      const windowWidth = window.innerWidth;
      if (windowWidth < 1000) {
        arg.view.calendar.changeView('dayGridDay');
      } else if (windowWidth < 1445) {
        arg.view.calendar.changeView('dayGridWeek');
      } else {
        arg.view.calendar.changeView('dayGridMonth');
      }
    },

    eventClick: this.handleEventClick.bind(this),
    eventBackgroundColor: '#3788d8',
    eventBorderColor: '#3788d8',
    eventTextColor: '#ffffff',
    eventDisplay: 'block',
    eventTimeFormat: { hour: 'numeric', minute: '2-digit', omitZeroMinute: false, meridiem: 'short' },
    eventDidMount: function (info) {
      if (info.event.extendedProps['type'] === 'entrenamiento') {
        info.el.style.backgroundColor = '#3788d8';
        info.el.style.borderColor = '#3788d8';
      } else if (info.event.extendedProps['type'] === 'partido') {
        info.el.style.backgroundColor = '#d83737';
        info.el.style.borderColor = '#d83737';
      } else if (info.event.extendedProps['type'] === 'reunion') {
        info.el.style.backgroundColor = '#37d84b';
        info.el.style.borderColor = '#37d84b';
      } else {
        info.el.style.backgroundColor = '#d8b837';
        info.el.style.borderColor = '#d8b837';
      }
    }

  };
  handleEventClick(info: any) {
    const dialogRef = this.dialog.open(PopUpDetallesEventoComponent, {
      width: '50%',
      height: '50%',
      data: { idEvento: info.event.id, nombreEvento: info.event.title, fechaInicio: info.event.start, fechaFin: info.event.end, descripcionEvento: info.event.extendedProps.description, lugarEvento: info.event.extendedProps.location, tipoEventoSeleccionado: info.event.extendedProps.type, esAdmin: this.admin }
    });
    dialogRef.afterClosed().subscribe(() => {
      this.eventosDeClub();
    });

  }

  esAdmin() {
    if (this.rol == 'administrador' || this.rol == 'gestor') {
      this.admin = true;
    } else {
      this.admin = false;
    }
  }

  mostrarCalendario() {
    this.calendario = true;
    this.jugadoresClub = false;
    this.equiposClub = false;
    this.ajustesClub = false;
  }
  mostrarJugadores() {
    this.calendario = false;
    this.jugadoresClub = true;
    this.equiposClub = false;
    this.ajustesClub = false;
    this.obtenerJugadores();
  }
  mostrarEquiposUnirse() {
    this.calendario = false;
    this.jugadoresClub = false;
    this.equiposClub = true;
    this.ajustesClub = false;
    this.showLoader = true;
    this.equiposDelClubNoEstaUser();
  }
  mostrarAjustes() {
    this.calendario = false;
    this.jugadoresClub = false;
    this.equiposClub = false;
    this.ajustesClub = true;
    this.obtenerDatosClub();
    this.equiposDelClub2();
  }

  seleccionar(seccion: string) {
    this.visible = seccion;
  }
  obtenerJugadores(): void {
    this.clubService.obtenerJugadores({ id_club: this.id_club }).subscribe({
      next: (jugadores: any[]) => {
        this.jugadores = jugadores.map(jugador => ({
          ...jugador,
          nombre: null // Preparar para almacenar el nombre
        }));
        this.jugadores.forEach(jugador => this.nombreJugador(jugador));
      },
      error: (err) => {
        console.error('Error fetching clubs:', err);
      }
    });
  }

  nombreJugador(jugador: any): void {
    this.clubService.nombreJugador({ dni: jugador.dni }).subscribe({
      next: (res: any) => {
        jugador.nombre = res.nombre; // Guardar nombre directamente en el jugador
        jugador.apellidos = res.apellidos;
        jugador.imagen = res.imagen;
      },
      error: (err) => {
        console.error('Error fetching player name:', err);
      }
    });
  }
  crearEvento(): void {
    const dialogRef = this.dialog.open(PopUpCrearEventoComponent, {
      width: '50%',
      height: '50%',
      data: { id_club: this.id_club }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.eventosDeClub();
    });
  }


  crearEquipoPopUp(): void {
    const dialogRef = this.dialog.open(PopUpCrearEquipoComponent, {
      width: '50%',
      height: '50%',
      data: { id_club: this.id_club, dni: this.usuarioLogeado.dni }
    });

    dialogRef.afterClosed().subscribe(() => {
      window.location.reload();
    });
  }
  editarEquipoPopUp(id_eqipo: any): void {
    const dialogRef = this.dialog.open(PopUpEditarEquipoComponent, {
      width: '50%',
      height: '50%',
      data: { id_eqipo: id_eqipo }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.equiposDelClub2();
    });

  }
  obtenerDatosClub(): void {
    if (this.id_club !== null) {
      const payload = { id_club: this.id_club };

      this.clubService.obtenerDatosClub(payload).subscribe({
        next: (res: any) => {
          this.nombreClub = res.nombre;
          this.codigoAcceso = res.codigoAcceso;
          this.localizacion = res.localizacion;
        },
        error: (err) => {
          console.error('Error fetching clubs:', err);
        }
      });
    } else {
      console.error('Club ID is not available');
    }
  }
  modificarClub(): void {
    const payload = {
      id_club: this.id_club,
      nombre: this.nombreClub,
      codigoAcceso: this.codigoAcceso,
      localizacion: this.localizacion
    };
    this.clubService.modificarClub(payload).subscribe({
      next: (res: any) => {
        if (res = true) {
          this.toastr.success('Club modificado correctamente');
        } else {
          this.toastr.error('Error al modificar el club');
        }
      },
      error: (err) => {
        console.error('Error fetching clubs:', err);
      }
    });
  }
  equiposDelClub2() {
    this.compartido.equiposClub({ id_club: this.id_club }).subscribe({
      next: (equipos: Equipo[]) => {
        this.equipos = equipos;
      },
      error: (err) => {
        console.error('Error al obtener la información:', err);
      }
    });
  }

  cambiarRolClub(dni: string, rolClub: string) {
    const body = { dni, rolClub: rolClub, id_club: this.id_club };
    this.http.post<any>(environment.url + "/api/cambiarRolClub", body).subscribe(
      () => this.toastr.success("Rol cambiado con éxito")
    );

  }

  equiposDelClub(): Observable<Equipo[]> {
    return this.compartido.equiposClub({ id_club: this.id_club });
  }
  equiposDelClubNoEstaUser() {
    forkJoin({
      equiposUsuario: this.clubService.obtenerEquiposUsuario({ dni: this.usuarioLogeado, id_club: this.id_club }),
      todosEquipos: this.equiposDelClub()
    }).subscribe({
      next: ({ equiposUsuario, todosEquipos }) => {
        this.equipos = todosEquipos.filter((equipoClub: Equipo) =>
          !equiposUsuario.some((equipoUsuario: Equipo) =>
            equipoUsuario.id_equipo === equipoClub.id_equipo));
        if (this.equipos.length === 0) {
          this.toastr.info('No hay equipos disponibles para unirse');
        }
        this.showLoader = false;
      },
      error: (err) => {
        console.error('Error al obtener la información:', err);
      }
    });
  }

  unirmeAEquipo(id_equipo: any) {
    this.compartido.unirseEquipo({ dni_usuario: this.usuarioLogeado.dni, id_equipo: id_equipo }).subscribe({
      next: (res: any) => {
        if (res = true) {
          this.toastr.success('Te has unido al equipo correctamente');
          this.equiposDelClubNoEstaUser();
          window.location.reload();
        } else {
          this.toastr.error('Error al unirte al equipo');
        }
      },
      error: (err) => {
        console.error('Error fetching clubs:', err);
      }
    });
  }
  borrarEquipo(id_equipo: any) {
    this.compartido.borrarEquipo({ id_equipo: id_equipo }).subscribe({
      next: (res: any) => {
        if (res = true) {
          this.toastr.success('Equipo borrado correctamente');
          this.equiposDelClub2();
        } else {
          this.toastr.error('Error al borrar el equipo');
        }
      },
      error: (err) => {
        console.error('Error fetching clubs:', err);
      }
    });
  }
  expulsarJugador(dni: any) {
    this.compartido.expulsarUsuario({ dni: dni, id_club: this.id_club }).subscribe({
      next: (res: any) => {
        if (res = true) {
          this.toastr.success('Jugador expulsado correctamente');
          this.obtenerJugadores();
        } else {
          this.toastr.error('Error al expulsar al jugador');
        }
      },
      error: (err) => {
        console.error('Error fetching clubs:', err);
      }
    });
  }
  borrarClub() {
    this.compartido.borrarClub({ id_club: this.id_club }).subscribe({
      next: (res: any) => {
        if (res = true) {
          this.toastr.success('Club borrado correctamente');
          this.router.navigate(['/dashboard']);
        } else {
          this.toastr.error('Error al borrar el club');
        }
      },
      error: (err) => {
        console.error('Error fetching clubs:', err);
      }
    });
  }
}
