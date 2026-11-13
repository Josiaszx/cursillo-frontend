import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { ApiError } from '../../core/api/api-error';
import { Notificaciones } from '../../core/services/notificaciones';
import { Alumno, EstadoFiltro } from '../../core/models';
import { TAMANO_PAGINA_DEFECTO } from '../../core/util/paginacion';
import { nombreCompleto } from '../../core/util/formato';
import { Icon } from '../../shared/ui/icon';
import { Paginador } from '../../shared/ui/paginador';
import { SelectorEstado } from '../../shared/ui/selector-estado';
import { GruposService } from '../grupos/grupos.service';
import { AlumnoForm } from './alumno-form';
import { AlumnosService } from './alumnos.service';

/** Espera tras la última tecla antes de buscar. */
const RETARDO_BUSQUEDA_MS = 300;

@Component({
  selector: 'app-alumnos-page',
  imports: [Icon, SelectorEstado, Paginador, AlumnoForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alumnos-page.html',
  styleUrl: './alumnos-page.scss',
})
export class AlumnosPage {
  private readonly notificaciones = inject(Notificaciones);
  private readonly service = inject(AlumnosService);
  private readonly gruposService = inject(GruposService);

  // Filtros y paginación: la API pagina, así que `page` y `size` viajan como parámetros.
  protected readonly estado = signal<EstadoFiltro>('habilitados');
  protected readonly grupoId = signal<number | null>(null);
  protected readonly buscar = signal('');
  protected readonly page = signal(1);
  protected readonly size = signal(TAMANO_PAGINA_DEFECTO);

  protected readonly alumnos = rxResource({
    params: () => ({
      estado: this.estado(),
      grupoId: this.grupoId(),
      buscar: this.buscar(),
      page: this.page(),
      size: this.size(),
    }),
    stream: ({ params }) => this.service.listar(params),
  });

  /** Para el filtro se ofrecen todos los grupos, también los inhabilitados. */
  protected readonly grupos = rxResource({
    stream: () => this.gruposService.listar('todos'),
  });

  protected readonly formAbierto = signal(false);
  protected readonly alumnoEditando = signal<Alumno | null>(null);
  /** CI del alumno con una operación en curso (deshabilita sus botones). */
  protected readonly procesando = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly nombreCompleto = nombreCompleto;

  private temporizador: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizador));
  }

  protected mensajeCarga(): string {
    return ApiError.desde(this.alumnos.error()).message;
  }

  protected alEscribirBusqueda(texto: string): void {
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => {
      this.buscar.set(texto.trim());
      this.page.set(1);
    }, RETARDO_BUSQUEDA_MS);
  }

  protected cambiarEstado(estado: EstadoFiltro): void {
    this.estado.set(estado);
    this.page.set(1);
  }

  protected cambiarGrupo(valor: string): void {
    this.grupoId.set(valor === '' ? null : Number(valor));
    this.page.set(1);
  }

  protected cambiarTamano(tamano: number): void {
    this.size.set(tamano);
    this.page.set(1);
  }

  protected hayFiltros(): boolean {
    return this.buscar() !== '' || this.grupoId() !== null;
  }

  protected nuevo(): void {
    this.alumnoEditando.set(null);
    this.formAbierto.set(true);
  }

  protected editar(alumno: Alumno): void {
    this.alumnoEditando.set(alumno);
    this.formAbierto.set(true);
  }

  protected alGuardar(alumno: Alumno): void {
    this.formAbierto.set(false);
    this.notificaciones.exito(`Alumno ${nombreCompleto(alumno)} guardado.`);
    this.alumnos.reload();
  }

  protected inhabilitar(alumno: Alumno): void {
    this.procesando.set(alumno.ci);
    this.error.set(null);
    this.service.inhabilitar(alumno.ci).subscribe({
      next: () => {
        this.procesando.set(null);
        this.notificaciones.exito(`Alumno ${nombreCompleto(alumno)} inhabilitado.`);
        this.alumnos.reload();
      },
      error: (e: unknown) => this.falla(e),
    });
  }

  /** Falla con `GRUPO_INHABILITADO` si su grupo sigue inhabilitado: el mensaje ya lo explica. */
  protected habilitar(alumno: Alumno): void {
    this.procesando.set(alumno.ci);
    this.error.set(null);
    this.service.habilitar(alumno.ci).subscribe({
      next: () => {
        this.procesando.set(null);
        this.notificaciones.exito(`Alumno ${nombreCompleto(alumno)} habilitado.`);
        this.alumnos.reload();
      },
      error: (e: unknown) => this.falla(e),
    });
  }

  private falla(e: unknown): void {
    this.procesando.set(null);
    this.error.set(ApiError.desde(e).message);
  }
}
