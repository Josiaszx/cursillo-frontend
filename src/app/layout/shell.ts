import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Icon, NombreIcono } from '../shared/ui/icon';
import { NotificacionesComponent } from '../shared/ui/notificaciones';

interface ItemMenu {
  ruta: string;
  etiqueta: string;
  icono: NombreIcono;
}

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon, NotificacionesComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  /** Solo las secciones que ya tienen endpoints en el backend. */
  protected readonly items: readonly ItemMenu[] = [
    { ruta: '/alumnos', etiqueta: 'Alumnos', icono: 'alumnos' },
    { ruta: '/grupos', etiqueta: 'Grupos', icono: 'grupos' },
    { ruta: '/profesores', etiqueta: 'Profesores', icono: 'profesores' },
  ];

  protected readonly colapsado = signal(false);

  /** Con `<base href="/">` un `href="#id"` navegaría a la raíz: se enfoca el contenido a mano. */
  protected irAlContenido(evento: Event): void {
    evento.preventDefault();
    document.getElementById('contenido')?.focus();
  }

  protected alternar(): void {
    this.colapsado.update((c) => !c);
  }
}
