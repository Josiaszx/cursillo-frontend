import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Iconos de trazo (24x24), tomados del diseño. Cada icono es una lista de trazados SVG. */
const ICONOS = {
  alumnos: [
    'M9 4.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z',
    'M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6',
    'M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.4c2.2.7 3.5 2.6 3.5 5.6',
  ],
  grupos: ['M12 3 3 8l9 5 9-5-9-5z', 'm3 13 9 5 9-5'],
  profesores: [
    'M6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-13A2.5 2.5 0 0 1 6.5 3Z',
    'M12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z',
    'M7.5 17c.6-2 2.4-3 4.5-3s3.9 1 4.5 3',
  ],
  'chevrons-izquierda': ['m11 17-5-5 5-5M18 17l-5-5 5-5'],
  mas: ['M12 5v14M5 12h14'],
  x: ['M6 6l12 12M18 6 6 18'],
  check: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'm8 12.2 2.7 2.7L16 9.5'],
  buscar: ['M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z', 'm20 20-4-4'],
} as const;

export type NombreIcono = keyof typeof ICONOS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      [attr.width]="tamano()"
      [attr.height]="tamano()"
    >
      @for (d of trazados(); track $index) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: 0 0 auto;
    }
  `,
})
export class Icon {
  readonly nombre = input.required<NombreIcono>();
  readonly tamano = input(20);

  protected readonly trazados = computed(() => ICONOS[this.nombre()]);
}
