import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { TAMANOS_PAGINA } from '../../core/util/paginacion';

/**
 * Pie estándar de todas las listas: rango mostrado, navegación numerada y selector de
 * elementos por página. El número de páginas se calcula aquí a partir de `total` y `size`.
 */
@Component({
  selector: 'app-paginador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paginador.html',
  styleUrl: './paginador.scss',
})
export class Paginador {
  readonly page = input.required<number>();
  readonly size = input.required<number>();
  readonly total = input.required<number>();
  readonly tamanos = input<readonly number[]>(TAMANOS_PAGINA);
  /** Línea superior: útil bajo una tabla; se quita si el paginador va en su propia tarjeta. */
  readonly borde = input(true);

  readonly pageChange = output<number>();
  readonly sizeChange = output<number>();

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.size())));
  protected readonly desde = computed(() => (this.total() === 0 ? 0 : (this.page() - 1) * this.size() + 1));
  protected readonly hasta = computed(() => Math.min(this.page() * this.size(), this.total()));

  /** Números de página a mostrar; `null` es un salto ("…"). Siempre: primera, última y vecinas. */
  protected readonly paginas = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const actual = this.page();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const visibles = [...new Set([1, actual - 1, actual, actual + 1, total])]
      .filter((p) => p >= 1 && p <= total)
      .sort((a, b) => a - b);

    const resultado: (number | null)[] = [];
    visibles.forEach((p, i) => {
      if (i > 0 && p - visibles[i - 1] > 1) resultado.push(null);
      resultado.push(p);
    });
    return resultado;
  });

  protected alCambiarTamano(evento: Event): void {
    this.sizeChange.emit(Number((evento.target as HTMLSelectElement).value));
  }
}
