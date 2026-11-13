import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../core/api/api-error';
import { hora, nombreCompleto } from '../../core/util/formato';
import { TAMANO_PAGINA_DEFECTO } from '../../core/util/paginacion';
import { Paginador } from '../../shared/ui/paginador';
import { ProfesoresService } from './profesores.service';

/** El detalle siempre muestra todas las clases, habilitadas o no. */
const ESTADO = 'todos';

@Component({
  selector: 'app-profesor-detalle-page',
  imports: [RouterLink, DatePipe, Paginador],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profesor-detalle-page.html',
  styleUrl: './profesor-detalle-page.scss',
})
export class ProfesorDetallePage {
  private readonly service = inject(ProfesoresService);

  /** Parámetro de ruta `:ci` (enlazado con `withComponentInputBinding`). */
  readonly ci = input.required<string>();

  /** Las clases las pagina la API (`page` y `size`). */
  protected readonly page = signal(1);
  protected readonly size = signal(TAMANO_PAGINA_DEFECTO);

  protected readonly hora = hora;
  protected readonly nombreCompleto = nombreCompleto;

  protected readonly profesor = rxResource({
    params: () => Number(this.ci()),
    stream: ({ params }) => this.service.obtener(params),
  });

  protected readonly clases = rxResource({
    params: () => ({ ci: Number(this.ci()), page: this.page(), size: this.size() }),
    stream: ({ params }) => this.service.clases(params.ci, ESTADO, params.page, params.size),
  });

  protected mensaje(error: unknown): string {
    return ApiError.desde(error).message;
  }

  protected cambiarTamano(tamano: number): void {
    this.size.set(tamano);
    this.page.set(1);
  }
}
