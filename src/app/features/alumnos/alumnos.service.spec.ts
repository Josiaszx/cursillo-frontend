import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AlumnosService } from './alumnos.service';

describe('AlumnosService', () => {
  let service: AlumnosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AlumnosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía filtros y paginación, y omite los vacíos', () => {
    service
      .listar({ estado: 'habilitados', grupoId: null, buscar: '', page: 2, size: 50 })
      .subscribe();

    const req = http.expectOne((r) => r.url.endsWith('/alumnos'));
    expect(req.request.params.get('estado')).toBe('habilitados');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('50');
    expect(req.request.params.has('grupoId')).toBe(false);
    expect(req.request.params.has('buscar')).toBe(false);
    req.flush({ items: [], page: 2, size: 50, total: 0, totalPages: 0 });
  });

  it('combina búsqueda y grupo', () => {
    service
      .listar({ estado: 'todos', grupoId: 2, buscar: 'camila', page: 1, size: 10 })
      .subscribe();

    const req = http.expectOne((r) => r.url.endsWith('/alumnos'));
    expect(req.request.params.get('grupoId')).toBe('2');
    expect(req.request.params.get('buscar')).toBe('camila');
    req.flush({ items: [], page: 1, size: 10, total: 0, totalPages: 0 });
  });

  it('crea con el CI en el cuerpo y edita con el CI en la ruta', () => {
    const cuerpo = {
      nombres: 'Sofía',
      apellidos: 'Benítez',
      edad: 19,
      correo: null,
      telefono: null,
      grupoId: 2,
    };

    service.crear({ ci: 100096, ...cuerpo }).subscribe();
    const post = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/alumnos'));
    expect(post.request.body.ci).toBe(100096);
    post.flush({});

    service.editar(100096, cuerpo).subscribe();
    const put = http.expectOne((r) => r.method === 'PUT' && r.url.endsWith('/alumnos/100096'));
    expect('ci' in put.request.body).toBe(false);
    put.flush({});
  });

  it('habilita e inhabilita con PATCH por CI', () => {
    service.inhabilitar(5).subscribe();
    http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/alumnos/5/inhabilitar')).flush({});

    service.habilitar(5).subscribe();
    http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/alumnos/5/habilitar')).flush({});
  });
});
