import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ApiError } from '../../core/api/api-error';
import { DURACION_MENSAJE_LARGO_MS, Notificaciones } from '../../core/services/notificaciones';
import { EstadoFiltro, Grupo } from '../../core/models';
import { Dialog } from '../../shared/ui/dialog';
import { PaginacionLocal } from '../../core/util/paginacion';
import { Icon } from '../../shared/ui/icon';
import { Paginador } from '../../shared/ui/paginador';
import { SelectorEstado } from '../../shared/ui/selector-estado';
import { GrupoForm } from './grupo-form';
import { GruposService } from './grupos.service';

interface CascadaPendiente {
  grupo: Grupo;
  alumnos: number;
  clases: number;
}

@Component({
  selector: 'app-grupos-page',
  imports: [RouterLink, Icon, SelectorEstado, GrupoForm, Dialog, Paginador],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grupos-page.html',
  styleUrl: './grupos-page.scss',
})
export class GruposPage {
  private readonly notificaciones = inject(Notificaciones);
  private readonly service = inject(GruposService);

  protected readonly estado = signal<EstadoFiltro>('habilitados');
  protected readonly grupos = rxResource({
    params: () => this.estado(),
    stream: ({ params }) => this.service.listar(params),
  });

  /** La API devuelve todos los grupos, así que se paginan aquí. */
  protected readonly paginacion = new PaginacionLocal(() => this.grupos.value());

  protected readonly formAbierto = signal(false);
  protected readonly grupoEditando = signal<Grupo | null>(null);
  protected readonly cascada = signal<CascadaPendiente | null>(null);
  /** Id del grupo con una operación en curso (deshabilita sus botones). */
  protected readonly procesando = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    // Cambiar el filtro de estado vuelve a la primera página.
    effect(() => {
      this.estado();
      untracked(() => this.paginacion.reiniciar());
    });
  }

  protected mensajeCarga(): string {
    return ApiError.desde(this.grupos.error()).message;
  }

  protected convocatoria(g: Grupo): string {
    const partes: string[] = [];
    if (g.anioConvocatoria !== null) partes.push(String(g.anioConvocatoria));
    if (g.numeroConvocatoria !== null) partes.push(`Nº ${g.numeroConvocatoria}`);
    return partes.length ? partes.join(' · ') : '—';
  }

  protected nuevo(): void {
    this.grupoEditando.set(null);
    this.formAbierto.set(true);
  }

  protected editar(grupo: Grupo): void {
    this.grupoEditando.set(grupo);
    this.formAbierto.set(true);
  }

  protected alGuardar(grupo: Grupo): void {
    this.formAbierto.set(false);
    this.notificaciones.exito(`Grupo "${grupo.nombre}" guardado.`);
    this.grupos.reload();
  }

  /** Paso 1: sin confirmación. Si hay alumnos o clases, el backend pide confirmar. */
  protected inhabilitar(grupo: Grupo): void {
    this.procesando.set(grupo.id);
    this.error.set(null);
    this.service.inhabilitar(grupo.id).subscribe({
      next: () => {
        this.procesando.set(null);
        this.notificaciones.exito(`Grupo "${grupo.nombre}" inhabilitado.`);
        this.grupos.reload();
      },
      error: (e: unknown) => {
        this.procesando.set(null);
        const err = ApiError.desde(e);
        if (err.codigo === 'CASCADA_REQUERIDA') {
          const impacto = err.detalles['impacto'] as { alumnos: number; clases: number };
          this.cascada.set({ grupo, alumnos: impacto.alumnos, clases: impacto.clases });
        } else {
          this.error.set(err.message);
        }
      },
    });
  }

  /** Paso 2: el usuario aceptó el impacto mostrado. */
  protected confirmarCascada(): void {
    const pendiente = this.cascada();
    if (!pendiente) return;
    this.cascada.set(null);
    this.procesando.set(pendiente.grupo.id);
    this.service.inhabilitar(pendiente.grupo.id, true).subscribe({
      next: (r) => {
        this.procesando.set(null);
        this.notificaciones.exito(
          `Grupo "${r.grupo.nombre}" inhabilitado. Se inhabilitaron ${r.afectados.alumnos} alumnos y ${r.afectados.clases} clases.`,
          DURACION_MENSAJE_LARGO_MS,
        );
        this.grupos.reload();
      },
      error: (e: unknown) => {
        this.procesando.set(null);
        this.error.set(ApiError.desde(e).message);
      },
    });
  }

  protected habilitar(grupo: Grupo): void {
    this.procesando.set(grupo.id);
    this.error.set(null);
    this.service.habilitar(grupo.id).subscribe({
      next: () => {
        this.procesando.set(null);
        this.notificaciones.exito(
          `Grupo "${grupo.nombre}" habilitado. Sus alumnos y clases siguen inhabilitados: hay que habilitarlos uno por uno.`,
          DURACION_MENSAJE_LARGO_MS,
        );
        this.grupos.reload();
      },
      error: (e: unknown) => {
        this.procesando.set(null);
        this.error.set(ApiError.desde(e).message);
      },
    });
  }
}
