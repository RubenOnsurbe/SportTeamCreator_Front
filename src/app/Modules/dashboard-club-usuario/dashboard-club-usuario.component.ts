import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // Import ActivatedRoute
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

  constructor(private route: ActivatedRoute, private clubService: ClubControllerService, private compartido: CompartidoService, private dialog: MatDialog, private toastr: ToastrService) {
    this.usuarioLogeado = obtenerSessionUsuario();
  }

  ngOnInit(): void {
    // Extract the clubId from the query parameters
    this.route.queryParams.subscribe(params => {
      const clubId = params['clubId'];
      const clubName = params['nombreClub'];
      if (clubId) {
        this.id_club = Number(clubId);
        this.nombreClub = clubName;
      }
    });
    this.sacarRoles(); // Llama a sacarRoles() primero
    this.compartido.mostrarEquipos$.subscribe(value => {
      this.mostrarEquipos = value;
    });
    this.eventosDeClub();
  }
  sacarRoles() {
    this.clubService.obtenerRolesUsuario({ dni: this.usuarioLogeado, id_club: this.id_club }).subscribe({
      next: (res: any) => {
        this.rol = res;
        console.log(this.rol);
        this.esAdmin(); // Llama a esAdmin() después de obtener los roles
        console.log(this.admin);
      },
      error: (err) => {
        console.error('Error fetching clubs:', err);
      }
    });
  }


  eventosDeClub() {
    this.compartido.obtenerEventosDeClub({ id_club: this.id_club, tipo: this.tipoEventoSeleccionado }).subscribe(
      (response) => {
        this.calendarOptions.events = response.map((evento: { titulo: any; fechaInicio: any; fechaFin: any; descripcion: any; ubicacion: any; tipo: any }) => ({
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
    buttonText: { today: "Hoy", dayGridMonth: 'Mes', dayGridWeek: 'Semana', dayGridDay: "Dia" }, // Establece el texto del botón "Hoy" en español

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

    eventClick: this.handleEventClick.bind(this)

  };

  handleEventClick(info: any) {
    const dialogRef = this.dialog.open(PopUpDetallesEventoComponent, {
      width: '50%',
      height: '50%',
      data: { nombreEvento: info.event.title, fechaInicio: info.event.start, fechaFin: info.event.end, descripcionEvento: info.event.extendedProps.description, lugarEvento: info.event.extendedProps.location, tipoEventoSeleccionado: info.event.extendedProps.type }
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
      data: { id_club: this.id_club }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.equiposDelClub();
    });
  }

  obtenerDatosClub(): void {
    if (this.id_club !== null) {
      const payload = { id_club: this.id_club };

      this.clubService.obtenerDatosClub(payload).subscribe({
        next: (res: any) => {
          console.log(res);
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

        // Aquí puedes procesar `this.equipos` como necesites
      },
      error: (err) => {
        console.error('Error al obtener la información:', err);
      }
    });
  }

  unirmeAEquipo(id_equipo: any) {
    console.log(id_equipo);
  }
}
