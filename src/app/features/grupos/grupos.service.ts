import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import {
  Alumno,
  Clase,
  EstadoFiltro,
  Grupo,
  Paginado,
  ResultadoInhabilitarGrupo,
} from '../../core/models';

/** Cuerpo de `POST /grupos` y `PUT /grupos/{id}` (sin `cantidadAlumnos` ni `habilitado`). */
export interface GrupoCuerpo {
  nombre: string;
  anioConvocatoria: number | null;
  numeroConvocatoria: number | null;
}

@Injectable({ providedIn: 'root' })
export class GruposService {
  private readonly api = inject(ApiClient);

  listar(estado: EstadoFiltro): Observable<Grupo[]> {
    return this.api.get<Grupo[]>('/grupos', { estado });
  }

  obtener(id: number): Observable<Grupo> {
    return this.api.get<Grupo>(`/grupos/${id}`);
  }

  alumnos(id: number, estado: EstadoFiltro): Observable<Alumno[]> {
    return this.api.get<Alumno[]>(`/grupos/${id}/alumnos`, { estado });
  }

  clases(id: number, estado: EstadoFiltro, page: number, size = 20): Observable<Paginado<Clase>> {
    return this.api.get<Paginado<Clase>>(`/grupos/${id}/clases`, { estado, page, size });
  }

  crear(cuerpo: GrupoCuerpo): Observable<Grupo> {
    return this.api.post<Grupo>('/grupos', cuerpo);
  }

  /** `PUT` reemplaza todos los campos editables: hay que enviar el objeto completo. */
  editar(id: number, cuerpo: GrupoCuerpo): Observable<Grupo> {
    return this.api.put<Grupo>(`/grupos/${id}`, cuerpo);
  }

  /**
   * Sin `confirmarCascada`, si el grupo tiene alumnos o clases habilitados el backend
   * responde 409 `CASCADA_REQUERIDA` con el impacto, y no cambia nada.
   */
  inhabilitar(id: number, confirmarCascada = false): Observable<ResultadoInhabilitarGrupo> {
    return this.api.patch<ResultadoInhabilitarGrupo>(`/grupos/${id}/inhabilitar`, {
      confirmarCascada: confirmarCascada ? true : undefined,
    });
  }

  /** Habilita solo el grupo: sus alumnos y clases siguen inhabilitados. */
  habilitar(id: number): Observable<Grupo> {
    return this.api.patch<Grupo>(`/grupos/${id}/habilitar`);
  }
}
