import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Paginador } from './paginador';

@Component({
  imports: [Paginador],
  template: `
    <app-paginador
      [page]="page()"
      [size]="size()"
      [total]="total()"
      (pageChange)="page.set($event)"
      (sizeChange)="size.set($event)"
    />
  `,
})
class Anfitrion {
  page = signal(1);
  size = signal(10);
  total = signal(95);
}

describe('Paginador', () => {
  async function crear() {
    const fixture = TestBed.createComponent(Anfitrion);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, host: fixture.componentInstance };
  }

  const etiquetas = (el: HTMLElement) =>
    Array.from(el.querySelectorAll('.pag, .salto')).map((n) => n.textContent?.trim());

  it('calcula las páginas a partir del total y del tamaño', async () => {
    const { el } = await crear();
    // 95 elementos / 10 por página = 10 páginas
    expect(etiquetas(el)).toEqual(['‹', '1', '2', '…', '10', '›']);
    expect(el.querySelector('.info')?.textContent).toContain('Mostrando 1–10 de 95');
  });

  it('muestra las vecinas de la página actual con saltos a ambos lados', async () => {
    const { fixture, el, host } = await crear();
    host.page.set(5);
    await fixture.whenStable();

    expect(etiquetas(el)).toEqual(['‹', '1', '…', '4', '5', '6', '…', '10', '›']);
    expect(el.querySelector('.info')?.textContent).toContain('Mostrando 41–50 de 95');
  });

  it('muestra todas las páginas si son pocas', async () => {
    const { fixture, el, host } = await crear();
    host.total.set(45);
    await fixture.whenStable();

    expect(etiquetas(el)).toEqual(['‹', '1', '2', '3', '4', '5', '›']);
  });

  it('recalcula el número de páginas al cambiar el tamaño', async () => {
    const { fixture, el, host } = await crear();
    host.size.set(50);
    await fixture.whenStable();

    expect(etiquetas(el)).toEqual(['‹', '1', '2', '›']);
    expect(el.querySelector('.info')?.textContent).toContain('Mostrando 1–50 de 95');
  });

  it('emite la página elegida y deshabilita "anterior" en la primera', async () => {
    const { fixture, el, host } = await crear();
    const botones = Array.from(el.querySelectorAll<HTMLButtonElement>('.pag'));
    expect(botones[0].disabled).toBe(true);

    botones.find((b) => b.textContent?.trim() === '2')!.click();
    await fixture.whenStable();
    expect(host.page()).toBe(2);
  });

  it('emite el nuevo tamaño al usar el selector', async () => {
    const { fixture, el, host } = await crear();
    const select = el.querySelector<HTMLSelectElement>('select')!;
    select.value = '20';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(host.size()).toBe(20);
  });
});
