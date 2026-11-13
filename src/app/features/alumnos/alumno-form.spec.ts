import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { errorInterceptor } from '../../core/api/error.interceptor';
import { AlumnoForm } from './alumno-form';

const alumno = (habilitado: boolean) => ({
  ci: 100096,
  nombres: 'Sofía',
  apellidos: 'Benítez',
  edad: 19,
  correo: null,
  telefono: null,
  grupo: { id: 2, nombre: 'Grupo B', habilitado: true },
  habilitado,
});

describe('AlumnoForm: comprobación del CI', () => {
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
    const fixture = TestBed.createComponent(AlumnoForm);
    fixture.detectChanges();
    await asentar();
    http.expectOne((r) => r.url.endsWith('/grupos')).flush([]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#alumno-ci')!;
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

  const pedidoCi = () => http.expectOne((r) => r.url.endsWith('/alumnos/100096'));

  it('no consulta mientras se escribe, solo al salir del campo', async () => {
    const { escribir, salir } = await abrir();
    await escribir('1000');
    await escribir('100096');
    http.expectNone((r) => r.url.includes('/alumnos/'));

    await salir();
    pedidoCi().flush(null, { status: 404, statusText: 'Not Found' });
  });

  it('con un CI libre (404) no muestra error', async () => {
    const { fixture, el, escribir, salir } = await abrir();
    await escribir('100096');
    await salir();
    pedidoCi().flush(
      { codigo: 'NO_ENCONTRADO', mensaje: 'No existe.', detalles: {} },
      { status: 404, statusText: 'Not Found' },
    );
    fixture.detectChanges();

    expect(el.querySelector('.field-error')).toBeNull();
  });

  it('avisa si el CI ya pertenece a un alumno habilitado', async () => {
    const { fixture, el, escribir, salir } = await abrir();
    await escribir('100096');
    await salir();
    pedidoCi().flush(alumno(true));
    fixture.detectChanges();

    const error = el.querySelector('.field-error')?.textContent;
    expect(error).toContain('Ya existe un alumno con este CI');
    expect(error).toContain('Benítez, Sofía');
    expect(el.querySelector('.reactivar')).toBeNull();
  });

  it('ofrece reactivar si el alumno existente está inhabilitado', async () => {
    const { fixture, el, escribir, salir } = await abrir();
    await escribir('100096');
    await salir();
    pedidoCi().flush(alumno(false));
    fixture.detectChanges();

    expect(el.querySelector('.field-error')?.textContent).toContain('inhabilitado');
    expect(el.querySelector('.reactivar')).not.toBeNull();
  });

  it('el aviso desaparece al corregir el CI', async () => {
    const { fixture, el, escribir, salir } = await abrir();
    await escribir('100096');
    await salir();
    pedidoCi().flush(alumno(false));
    fixture.detectChanges();

    await escribir('100097');
    expect(el.querySelector('.field-error')).toBeNull();
    expect(el.querySelector('.reactivar')).toBeNull();
  });
});

describe('AlumnoForm: reactivar un alumno inhabilitado', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  const asentar = () => new Promise<void>((r) => setTimeout(r));

  it('reactiva con PATCH habilitar y emite el alumno guardado', async () => {
    const fixture = TestBed.createComponent(AlumnoForm);
    const guardados: unknown[] = [];
    fixture.componentInstance.guardado.subscribe((a) => guardados.push(a));
    fixture.detectChanges();
    await asentar();
    http.expectOne((r) => r.url.endsWith('/grupos')).flush([]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#alumno-ci')!;
    input.value = '100096';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await asentar();
    http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/alumnos/100096')).flush(alumno(false));
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.reactivar')!.click();
    http
      .expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/alumnos/100096/habilitar'))
      .flush(alumno(true));

    expect(guardados.length).toBe(1);
  });

  it('si su grupo sigue inhabilitado, muestra el mensaje del backend y no emite', async () => {
    const fixture = TestBed.createComponent(AlumnoForm);
    const guardados: unknown[] = [];
    fixture.componentInstance.guardado.subscribe((a) => guardados.push(a));
    fixture.detectChanges();
    await asentar();
    http.expectOne((r) => r.url.endsWith('/grupos')).flush([]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector<HTMLInputElement>('#alumno-ci')!;
    input.value = '100096';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    await asentar();
    http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/alumnos/100096')).flush(alumno(false));
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.reactivar')!.click();
    http.expectOne((r) => r.method === 'PATCH').flush(
      {
        codigo: 'GRUPO_INHABILITADO',
        mensaje: 'El grupo "Grupo B" está inhabilitado.',
        detalles: { grupoId: 2 },
      },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(guardados.length).toBe(0);
    expect(el.querySelector('.alert-error')?.textContent).toContain('está inhabilitado');
  });
});
