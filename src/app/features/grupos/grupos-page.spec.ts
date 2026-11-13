import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { errorInterceptor } from '../../core/api/error.interceptor';
import { GruposPage } from './grupos-page';

const grupo = {
  id: 1,
  nombre: 'Grupo A',
  anioConvocatoria: 2024,
  numeroConvocatoria: 1,
  cantidadAlumnos: 15,
  habilitado: true,
};

describe('GruposPage: inhabilitar con cascada', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    // jsdom no implementa <dialog>.showModal()
    HTMLDialogElement.prototype.showModal = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  /** Deja correr los efectos/microtareas sin esperar a las peticiones HTTP pendientes. */
  const asentar = () => new Promise<void>((r) => setTimeout(r));

  const boton = (el: HTMLElement, texto: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === texto,
    )!;

  async function abrir() {
    const fixture = TestBed.createComponent(GruposPage);
    fixture.detectChanges();
    await asentar();
    http.expectOne((r) => r.url.endsWith('/grupos')).flush([grupo]);
    fixture.detectChanges();
    await asentar();
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const patchInhabilitar = () =>
    http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/grupos/1/inhabilitar'));

  async function hastaDialogoDeCascada() {
    const { fixture, el } = await abrir();
    boton(el, 'Inhabilitar').click();

    const paso1 = patchInhabilitar();
    expect(paso1.request.params.has('confirmarCascada')).toBe(false);
    paso1.flush(
      {
        codigo: 'CASCADA_REQUERIDA',
        mensaje: 'Inhabilitar el grupo también inhabilitará sus alumnos y clases.',
        detalles: { impacto: { alumnos: 15, clases: 66 } },
      },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();
    await asentar();
    fixture.detectChanges();
    return { fixture, el };
  }

  it('muestra el impacto y no inhabilita hasta que el usuario confirma', async () => {
    const { el } = await hastaDialogoDeCascada();

    const dialogo = el.querySelector('app-dialog')!;
    expect(dialogo.textContent).toContain('15 alumnos');
    expect(dialogo.textContent).toContain('66 clases');
    // Ninguna segunda llamada todavía.
    http.expectNone((r) => r.method === 'PATCH');
  });

  it('al confirmar repite la llamada con confirmarCascada=true y recarga la lista', async () => {
    const { fixture, el } = await hastaDialogoDeCascada();

    boton(el, 'Sí, inhabilitar').click();
    const paso2 = patchInhabilitar();
    expect(paso2.request.params.get('confirmarCascada')).toBe('true');
    paso2.flush({
      grupo: { ...grupo, habilitado: false, cantidadAlumnos: 0 },
      afectados: { alumnos: 15, clases: 66 },
    });
    fixture.detectChanges();
    await asentar();

    http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/grupos')).flush([]);
    expect(el.querySelector('app-dialog')).toBeNull();
  });

  it('al cancelar no se hace una segunda llamada', async () => {
    const { fixture, el } = await hastaDialogoDeCascada();

    boton(el, 'Cancelar').click();
    fixture.detectChanges();

    expect(el.querySelector('app-dialog')).toBeNull();
    http.expectNone((r) => r.method === 'PATCH');
  });
});
