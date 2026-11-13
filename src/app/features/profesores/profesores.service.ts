import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { Clase, EstadoFiltro, Paginado, Profesor } from '../../core/models';

/** Cuerpo de `PUT /profesores/{ci}`: el CI va en la ruta y no se puede cambiar. */
export interface ProfesorCuerpo {
  nombres: string;
  apellidos: string;
  edad: number | null;
  correo: string | null;
  telefono: string | null;
}

/** Cuerpo de `POST /profesores`. */
export interface ProfesorNuevo extends ProfesorCuerpo {
  ci: number;
}

@Injectable({ providedIn: 'root' })
export class ProfesoresService {
  private readonly api = inject(ApiClient);

  listar(estado: EstadoFiltro): Observable<Profesor[]> {
    return this.api.get<Profesor[]>('/profesores', { estado });
  }

  obtener(ci: number): Observable<Profesor> {
    return this.api.get<Profesor>(`/profesores/${ci}`);
  }

  clases(ci: number, estado: EstadoFiltro, page: number, size: number): Observable<Paginado<Clase>> {
    return this.api.get<Paginado<Clase>>(`/profesores/${ci}/clases`, { estado, page, size });
  }

  crear(cuerpo: ProfesorNuevo): Observable<Profesor> {
    return this.api.post<Profesor>('/profesores', cuerpo);
  }

  /** `PUT` reemplaza todos los campos editables: hay que enviar el objeto completo. */
  editar(ci: number, cuerpo: ProfesorCuerpo): Observable<Profesor> {
    return this.api.put<Profesor>(`/profesores/${ci}`, cuerpo);
  }

  /** Falla con 409 `TIENE_CLASES_FUTURAS` si tiene clases habilitadas por dictar. */
  inhabilitar(ci: number): Observable<Profesor> {
    return this.api.patch<Profesor>(`/profesores/${ci}/inhabilitar`);
  }

  /** Siempre permitido. */
  habilitar(ci: number): Observable<Profesor> {
    return this.api.patch<Profesor>(`/profesores/${ci}/habilitar`);
  }
}
