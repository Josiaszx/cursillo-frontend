import { computed, signal } from '@angular/core';

/** Tamaños de página ofrecidos al usuario. El máximo (100) es el límite de la API. */
export const TAMANOS_PAGINA = [10, 20, 50, 100] as const;
export const TAMANO_PAGINA_DEFECTO = 20;

/**
 * Paginación en el cliente, para listas que la API devuelve completas (arreglos sin
 * `page`/`size`). Las listas paginadas por la API usan sus propios `page` y `size`.
 */
export class PaginacionLocal<T> {
  readonly page = signal(1);
  readonly size = signal(TAMANO_PAGINA_DEFECTO);

  readonly total = computed(() => this.origen()?.length ?? 0);

  /** La página pedida, acotada: si la lista se achica, no queda en una página inexistente. */
  readonly paginaActual = computed(() =>
    Math.min(this.page(), Math.max(1, Math.ceil(this.total() / this.size()))),
  );

  readonly visibles = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.size();
    return (this.origen() ?? []).slice(inicio, inicio + this.size());
  });

  constructor(private readonly origen: () => readonly T[] | undefined) {}

  irA(pagina: number): void {
    this.page.set(pagina);
  }

  cambiarTamano(tamano: number): void {
    this.size.set(tamano);
    this.page.set(1);
  }

  reiniciar(): void {
    this.page.set(1);
  }
}
