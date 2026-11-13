import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProfesoresService } from './profesores.service';

describe('ProfesoresService', () => {
  let service: ProfesoresService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProfesoresService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista con el parámetro estado', () => {
    service.listar('inhabilitados').subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/profesores'));
    expect(req.request.params.get('estado')).toBe('inhabilitados');
    req.flush([]);
  });

  it('pagina las clases del profesor por CI', () => {
    service.clases(200011, 'todos', 2, 50).subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/profesores/200011/clases'));
    expect(req.request.params.get('estado')).toBe('todos');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('50');
    req.flush({ items: [], page: 2, size: 50, total: 0, totalPages: 0 });
  });

  it('crea con el CI en el cuerpo y edita con el CI en la ruta', () => {
    const cuerpo = { nombres: 'Laura', apellidos: 'Giménez', edad: 38, correo: null, telefono: null };

    service.crear({ ci: 200011, ...cuerpo }).subscribe();
    const post = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/profesores'));
    expect(post.request.body.ci).toBe(200011);
    post.flush({});

    service.editar(200011, cuerpo).subscribe();
    const put = http.expectOne((r) => r.method === 'PUT' && r.url.endsWith('/profesores/200011'));
    expect('ci' in put.request.body).toBe(false);
    put.flush({});
  });

  it('habilita e inhabilita con PATCH por CI', () => {
    service.inhabilitar(7).subscribe();
    http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/profesores/7/inhabilitar')).flush({});

    service.habilitar(7).subscribe();
    http.expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/profesores/7/habilitar')).flush({});
  });
});
