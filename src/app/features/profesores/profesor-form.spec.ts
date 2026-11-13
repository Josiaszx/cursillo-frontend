import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProfesorForm } from './profesor-form';

const profesor = (habilitado: boolean) => ({
  ci: 200011,
  nombres: 'Laura',
  apellidos: 'Giménez',
  edad: 38,
  correo: null,
  telefono: null,
  habilitado,
});

describe('ProfesorForm: comprobación del CI', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    // jsdom no implementa <dialog>.showModal()
    HTMLDialogElement.prototype.showModal = vi.fn();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  /** Deja correr los efectos/microtareas sin esperar a las peticiones HTTP pendientes. */
  const asentar = () => new Promise<void>((r) => setTimeout(r));

  async function abrir() {
    const fixture = TestBed.createComponent(ProfesorForm);
    fixture.detectChanges();
    await asentar();

    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#profesor-ci')!;
    const escribir = async (valor: string) => {
      input.value = valor;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await asentar();
    };
    const salir = async () => {
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await asentar();
    };
    return { fixture, el, escribir, salir };
  }

  const pedidoCi = () => http.expectOne((r) => r.url.endsWith('/profesores/200011'));

  it('consulta solo al salir del campo', async () => {
    const { escribir, salir } = await abrir();
    await escribir('200011');
    http.expectNone((r) => r.url.includes('/profesores/'));

    await salir();
    pedidoCi().flush(null, { status: 404, statusText: 'Not Found' });
  });

  it('avisa si el CI ya pertenece a un profesor habilitado', async () => {
    const { fixture, el, escribir, salir } = await abrir();
    await escribir('200011');
    await salir();
    pedidoCi().flush(profesor(true));
    fixture.detectChanges();

    expect(el.querySelector('.field-error')?.textContent).toContain('Giménez, Laura');
    expect(el.querySelector('.reactivar')).toBeNull();
  });

  it('ofrece reactivar si el profesor existente está inhabilitado', async () => {
    const { fixture, el, escribir, salir } = await abrir();
    await escribir('200011');
    await salir();
    pedidoCi().flush(profesor(false));
    fixture.detectChanges();

    expect(el.querySelector('.field-error')?.textContent).toContain('inhabilitado');
    expect(el.querySelector('.reactivar')).not.toBeNull();
  });
});
