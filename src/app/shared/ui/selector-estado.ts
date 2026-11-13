import { ChangeDetectionStrategy, Component, model } from '@angular/core';

import { EstadoFiltro } from '../../core/models';

/** Selector del parámetro `estado` de las listas (habilitados, inhabilitados, todos). */
@Component({
  selector: 'app-selector-estado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grupo" role="group" aria-label="Filtrar por estado">
      @for (o of opciones; track o.valor) {
        <button
          type="button"
          class="seg"
          [class.on]="valor() === o.valor"
          [attr.aria-pressed]="valor() === o.valor"
          (click)="valor.set(o.valor)"
        >
          {{ o.etiqueta }}
        </button>
      }
    </div>
  `,
  styles: `
    .grupo {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .seg {
      height: 40px;
      padding: 0 18px;
      border: 1px solid var(--color-borde-fuerte);
      border-radius: 999px;
      background: var(--color-superficie);
      color: var(--color-sidebar);
      font: inherit;
      font-weight: 500;
      cursor: pointer;
    }
    .seg:hover {
      background: var(--color-fondo);
    }
    .seg.on {
      background: var(--color-primario);
      border-color: var(--color-primario);
      color: #fff;
    }
  `,
})
export class SelectorEstado {
  readonly valor = model.required<EstadoFiltro>();

  protected readonly opciones: readonly { valor: EstadoFiltro; etiqueta: string }[] = [
    { valor: 'habilitados', etiqueta: 'Habilitados' },
    { valor: 'inhabilitados', etiqueta: 'Inhabilitados' },
    { valor: 'todos', etiqueta: 'Todos' },
  ];
}
