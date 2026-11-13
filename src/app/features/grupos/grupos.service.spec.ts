import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { GruposService } from './grupos.service';

describe('GruposService', () => {
  let service: GruposService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GruposService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista con el parámetro estado', () => {
    service.listar('todos').subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/grupos'));
    expect(req.request.params.get('estado')).toBe('todos');
    req.flush([]);
  });

  it('inhabilita sin confirmarCascada en el primer paso', () => {
    service.inhabilitar(3).subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/grupos/3/inhabilitar'));
    expect(req.request.method).toBe('PATCH');
    expect(req.request.params.has('confirmarCascada')).toBe(false);
    req.flush({ grupo: {}, afectados: { alumnos: 0, clases: 0 } });
  });

  it('inhabilita con confirmarCascada=true en el segundo paso', () => {
    service.inhabilitar(3, true).subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/grupos/3/inhabilitar'));
    expect(req.request.params.get('confirmarCascada')).toBe('true');
    req.flush({ grupo: {}, afectados: { alumnos: 15, clases: 66 } });
  });

  it('pagina las clases del grupo', () => {
    service.clases(2, 'habilitados', 3).subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/grupos/2/clases'));
    expect(req.request.params.get('page')).toBe('3');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({ items: [], page: 3, size: 20, total: 0, totalPages: 0 });
  });
});
