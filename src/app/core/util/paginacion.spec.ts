import { signal } from '@angular/core';

import { PaginacionLocal } from './paginacion';

describe('PaginacionLocal', () => {
  const numeros = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

  it('devuelve solo los elementos de la página actual', () => {
    const origen = signal<number[] | undefined>(numeros(45));
    const p = new PaginacionLocal(() => origen());
    p.cambiarTamano(10);
    p.irA(3);

    expect(p.visibles()).toEqual(numeros(30).slice(20));
    expect(p.total()).toBe(45);
  });

  it('cambiar el tamaño vuelve a la primera página', () => {
    const p = new PaginacionLocal(() => numeros(45));
    p.irA(2);
    p.cambiarTamano(50);

    expect(p.paginaActual()).toBe(1);
    expect(p.visibles().length).toBe(45);
  });

  it('acota la página si la lista se achica', () => {
    const origen = signal<number[] | undefined>(numeros(45));
    const p = new PaginacionLocal(() => origen());
    p.cambiarTamano(10);
    p.irA(5);

    origen.set(numeros(12));

    expect(p.paginaActual()).toBe(2);
    expect(p.visibles()).toEqual([11, 12]);
  });

  it('tolera un origen aún no cargado', () => {
    const p = new PaginacionLocal<number>(() => undefined);
    expect(p.total()).toBe(0);
    expect(p.visibles()).toEqual([]);
    expect(p.paginaActual()).toBe(1);
  });
});
