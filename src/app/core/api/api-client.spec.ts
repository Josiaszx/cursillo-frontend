import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiClient } from './api-client';
import { ApiError } from './api-error';
import { errorInterceptor } from './error.interceptor';

describe('ApiClient + errorInterceptor', () => {
  let api: ApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    api = TestBed.inject(ApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('antepone la URL base y omite parámetros vacíos', () => {
    api.get('/alumnos', { buscar: '', grupoId: 2, estado: undefined, page: 1 }).subscribe();

    const req = http.expectOne((r) => r.url === 'http://localhost:5082/alumnos');
    expect(req.request.params.has('buscar')).toBe(false);
    expect(req.request.params.has('estado')).toBe(false);
    expect(req.request.params.get('grupoId')).toBe('2');
    expect(req.request.params.get('page')).toBe('1');
    req.flush({});
  });

  it('convierte el cuerpo de error del backend en ApiError', () => {
    let error: unknown;
    api.post('/grupos', {}).subscribe({ error: (e) => (error = e) });

    http.expectOne('http://localhost:5082/grupos').flush(
      {
        codigo: 'VALIDACION',
        mensaje: 'Hay datos inválidos en la solicitud.',
        detalles: { nombre: ['Es obligatorio.'] },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(error).toBeInstanceOf(ApiError);
    const e = error as ApiError;
    expect(e.status).toBe(400);
    expect(e.codigo).toBe('VALIDACION');
    expect(e.message).toBe('Hay datos inválidos en la solicitud.');
    expect(e.erroresPorCampo).toEqual({ nombre: ['Es obligatorio.'] });
  });

  it('conserva los detalles de un 409 (cascada)', () => {
    let error: unknown;
    api.patch('/grupos/1/inhabilitar').subscribe({ error: (e) => (error = e) });

    http.expectOne('http://localhost:5082/grupos/1/inhabilitar').flush(
      {
        codigo: 'CASCADA_REQUERIDA',
        mensaje: 'Inhabilitar el grupo también inhabilitará sus alumnos y clases.',
        detalles: { impacto: { alumnos: 15, clases: 66 } },
      },
      { status: 409, statusText: 'Conflict' },
    );

    const e = error as ApiError;
    expect(e.codigo).toBe('CASCADA_REQUERIDA');
    expect(e.detalles['impacto']).toEqual({ alumnos: 15, clases: 66 });
    expect(e.erroresPorCampo).toEqual({});
  });

  it('marca como RED un fallo de conexión', () => {
    let error: unknown;
    api.get('/grupos').subscribe({ error: (e) => (error = e) });

    http.expectOne('http://localhost:5082/grupos').error(new ProgressEvent('error'));

    expect((error as ApiError).codigo).toBe('RED');
  });
});
