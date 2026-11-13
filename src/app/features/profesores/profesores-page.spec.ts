import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { errorInterceptor } from '../../core/api/error.interceptor';
import { ProfesoresPage } from './profesores-page';

const profesor = {
  ci: 200011,
  nombres: 'Laura',
  apellidos: 'Giménez',
  edad: 38,
  correo: null,
  telefono: null,
  habilitado: true,
};

describe('ProfesoresPage: inhabilitar', () => {
  let http: HttpTestingController;

  beforeEach(() => {
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

  async function abrir() {
    const fixture = TestBed.createComponent(ProfesoresPage);
    fixture.detectChanges();
    await asentar();
    http.expectOne((r) => r.url.endsWith('/profesores')).flush([profesor]);
    fixture.detectChanges();
    await asentar();
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  const inhabilitar = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => b.textContent?.trim() === 'Inhabilitar')!
      .click();

  it('explica cuántas clases futuras impiden inhabilitar al profesor', async () => {
    const { fixture, el } = await abrir();
    inhabilitar(el);

    http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/profesores/200011/inhabilitar')).flush(
      {
        codigo: 'TIENE_CLASES_FUTURAS',
        mensaje: 'El profesor tiene clases futuras habilitadas.',
        detalles: { clasesFuturas: 4 },
      },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    const alerta = el.querySelector('.alert-error')?.textContent;
    expect(alerta).toContain('Giménez, Laura');
    expect(alerta).toContain('4 clases futuras habilitadas');
  });

  it('usa el singular con una sola clase futura', async () => {
    const { fixture, el } = await abrir();
    inhabilitar(el);

    http.expectOne((r) => r.method === 'PATCH').flush(
      { codigo: 'TIENE_CLASES_FUTURAS', mensaje: 'x', detalles: { clasesFuturas: 1 } },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(el.querySelector('.alert-error')?.textContent).toContain('1 clase futura habilitada');
  });
});
