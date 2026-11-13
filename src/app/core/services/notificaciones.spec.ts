import { TestBed } from '@angular/core/testing';

import { DESVANECER_MS, DURACION_MENSAJE_MS, Notificaciones } from './notificaciones';

describe('Notificaciones', () => {
  let servicio: Notificaciones;

  beforeEach(() => {
    vi.useFakeTimers();
    servicio = TestBed.inject(Notificaciones);
  });

  afterEach(() => vi.useRealTimers());

  it('muestra el aviso, lo desvanece a los 2 s y luego lo quita', () => {
    servicio.exito('Guardado.');
    expect(servicio.items()).toEqual([{ id: 1, texto: 'Guardado.', saliendo: false }]);

    vi.advanceTimersByTime(DURACION_MENSAJE_MS - 1);
    expect(servicio.items()[0].saliendo).toBe(false);

    vi.advanceTimersByTime(1);
    expect(servicio.items()[0].saliendo).toBe(true);

    vi.advanceTimersByTime(DESVANECER_MS);
    expect(servicio.items()).toEqual([]);
  });

  it('respeta una duración personalizada y apila varios avisos', () => {
    servicio.exito('Uno.');
    servicio.exito('Dos.', 5000);
    expect(servicio.items().length).toBe(2);

    vi.advanceTimersByTime(DURACION_MENSAJE_MS + DESVANECER_MS);
    expect(servicio.items().map((n) => n.texto)).toEqual(['Dos.']);
  });
});
