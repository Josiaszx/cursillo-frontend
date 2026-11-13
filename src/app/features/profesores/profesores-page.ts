import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../core/api/api-error';
import { EstadoFiltro, Profesor } from '../../core/models';
import { Notificaciones } from '../../core/services/notificaciones';
import { iniciales, nombreCompleto } from '../../core/util/formato';
import { PaginacionLocal } from '../../core/util/paginacion';
import { Icon } from '../../shared/ui/icon';
import { Paginador } from '../../shared/ui/paginador';
import { SelectorEstado } from '../../shared/ui/selector-estado';
import { ProfesorForm } from './profesor-form';
import { ProfesoresService } from './profesores.service';

@Component({
  selector: 'app-profesores-page',
  imports: [RouterLink, Icon, SelectorEstado, Paginador, ProfesorForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profesores-page.html',
  styleUrl: './profesores-page.scss',
})
export class ProfesoresPage {
  private readonly notificaciones = inject(Notificaciones);
  private readonly service = inject(ProfesoresService);

  protected readonly estado = signal<EstadoFiltro>('habilitados');
  protected readonly profesores = rxResource({
    params: () => this.estado(),
    stream: ({ params }) => this.service.listar(params),
  });

  /** La API devuelve todos los profesores, así que se paginan aquí. */
  protected readonly paginacion = new PaginacionLocal(() => this.profesores.value());

  protected readonly formAbierto = signal(false);
  protected readonly profesorEditando = signal<Profesor | null>(null);
  /** CI del profesor con una operación en curso (deshabilita sus botones). */
  protected readonly procesando = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly iniciales = iniciales;
  protected readonly nombreCompleto = nombreCompleto;

  constructor() {
    // Cambiar el filtro de estado vuelve a la primera página.
    effect(() => {
      this.estado();
      untracked(() => this.paginacion.reiniciar());
    });
  }

  protected mensajeCarga(): string {
    return ApiError.desde(this.profesores.error()).message;
  }

  protected nuevo(): void {
    this.profesorEditando.set(null);
    this.formAbierto.set(true);
  }

  protected editar(profesor: Profesor): void {
    this.profesorEditando.set(profesor);
    this.formAbierto.set(true);
  }

  protected alGuardar(profesor: Profesor): void {
    this.formAbierto.set(false);
    this.notificaciones.exito(`Profesor ${nombreCompleto(profesor)} guardado.`);
    this.profesores.reload();
  }

  /** Falla con `TIENE_CLASES_FUTURAS` si tiene clases habilitadas por dictar. */
  protected inhabilitar(profesor: Profesor): void {
    this.procesando.set(profesor.ci);
    this.error.set(null);
    this.service.inhabilitar(profesor.ci).subscribe({
      next: () => {
        this.procesando.set(null);
        this.notificaciones.exito(`Profesor ${nombreCompleto(profesor)} inhabilitado.`);
        this.profesores.reload();
      },
      error: (e: unknown) => {
        this.procesando.set(null);
        const err = ApiError.desde(e);
        if (err.codigo === 'TIENE_CLASES_FUTURAS') {
          const n = Number(err.detalles['clasesFuturas']);
          this.error.set(
            `No se puede inhabilitar a ${nombreCompleto(profesor)}: tiene ${n} ${n === 1 ? 'clase futura habilitada' : 'clases futuras habilitadas'}. Reasígnelas o inhabilítelas antes.`,
          );
        } else {
          this.error.set(err.message);
        }
      },
    });
  }

  protected habilitar(profesor: Profesor): void {
    this.procesando.set(profesor.ci);
    this.error.set(null);
    this.service.habilitar(profesor.ci).subscribe({
      next: () => {
        this.procesando.set(null);
        this.notificaciones.exito(`Profesor ${nombreCompleto(profesor)} habilitado.`);
        this.profesores.reload();
      },
      error: (e: unknown) => {
        this.procesando.set(null);
        this.error.set(ApiError.desde(e).message);
      },
    });
  }
}
