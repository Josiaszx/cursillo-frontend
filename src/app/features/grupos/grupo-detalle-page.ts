import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../core/api/api-error';
import { hora, nombreCompleto } from '../../core/util/formato';
import { PaginacionLocal, TAMANO_PAGINA_DEFECTO } from '../../core/util/paginacion';
import { Paginador } from '../../shared/ui/paginador';
import { GruposService } from './grupos.service';

type Pestana = 'alumnos' | 'clases';

/** El detalle siempre muestra todos los registros, habilitados o no. */
const ESTADO = 'todos';

@Component({
  selector: 'app-grupo-detalle-page',
  imports: [RouterLink, DatePipe, Paginador],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grupo-detalle-page.html',
  styleUrl: './grupo-detalle-page.scss',
})
export class GrupoDetallePage {
  private readonly service = inject(GruposService);

  /** Parámetro de ruta `:id` (enlazado con `withComponentInputBinding`). */
  readonly id = input.required<string>();

  protected readonly pestana = signal<Pestana>('alumnos');
  /** Paginación de las clases: la hace la API (`page` y `size`). */
  protected readonly page = signal(1);
  protected readonly size = signal(TAMANO_PAGINA_DEFECTO);

  protected readonly hora = hora;
  protected readonly nombreCompleto = nombreCompleto;

  protected readonly grupo = rxResource({
    params: () => Number(this.id()),
    stream: ({ params }) => this.service.obtener(params),
  });

  /** Solo se carga con su pestaña activa: `undefined` deja el recurso inactivo. */
  protected readonly alumnos = rxResource({
    params: () =>
      this.pestana() === 'alumnos' ? { id: Number(this.id()) } : undefined,
    stream: ({ params }) => this.service.alumnos(params.id, ESTADO),
  });

  /** Los alumnos llegan completos, así que se paginan aquí. */
  protected readonly paginacionAlumnos = new PaginacionLocal(() => this.alumnos.value());

  protected readonly clases = rxResource({
    params: () =>
      this.pestana() === 'clases'
        ? { id: Number(this.id()), page: this.page(), size: this.size() }
        : undefined,
    stream: ({ params }) => this.service.clases(params.id, ESTADO, params.page, params.size),
  });

  protected mensaje(error: unknown): string {
    return ApiError.desde(error).message;
  }

  protected cambiarPestana(p: Pestana): void {
    this.pestana.set(p);
    this.page.set(1);
    this.paginacionAlumnos.reiniciar();
  }

  protected cambiarTamanoClases(tamano: number): void {
    this.size.set(tamano);
    this.page.set(1);
  }

  protected convocatoria(): string {
    const g = this.grupo.value();
    if (!g) return '';
    const partes: string[] = [];
    if (g.anioConvocatoria !== null) partes.push(String(g.anioConvocatoria));
    if (g.numeroConvocatoria !== null) partes.push(`Nº ${g.numeroConvocatoria}`);
    return partes.join(' · ');
  }
}
