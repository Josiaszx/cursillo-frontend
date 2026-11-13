import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClient } from '../../core/api/api-client';
import { Alumno, EstadoFiltro, Paginado } from '../../core/models';

export interface FiltroAlumnos {
  estado: EstadoFiltro;
  grupoId: number | null;
  /** Texto contenido en CI, nombres, apellidos o "nombres apellidos". Distingue acentos. */
  buscar: string;
  page: number;
  size: number;
}

/** Cuerpo de `PUT /alumnos/{ci}`: el CI va en la ruta y no se puede cambiar. */
export interface AlumnoCuerpo {
  nombres: string;
  apellidos: string;
  edad: number | null;
  correo: string | null;
  telefono: string | null;
  grupoId: number;
}

/** Cuerpo de `POST /alumnos`. */
export interface AlumnoNuevo extends AlumnoCuerpo {
  ci: number;
}

@Injectable({ providedIn: 'root' })
export class AlumnosService {
  private readonly api = inject(ApiClient);

  listar(filtro: FiltroAlumnos): Observable<Paginado<Alumno>> {
    return this.api.get<Paginado<Alumno>>('/alumnos', { ...filtro });
  }

  obtener(ci: number): Observable<Alumno> {
    return this.api.get<Alumno>(`/alumnos/${ci}`);
  }

  crear(cuerpo: AlumnoNuevo): Observable<Alumno> {
    return this.api.post<Alumno>('/alumnos', cuerpo);
  }

  /** `PUT` reemplaza todos los campos editables; también sirve para cambiar de grupo. */
  editar(ci: number, cuerpo: AlumnoCuerpo): Observable<Alumno> {
    return this.api.put<Alumno>(`/alumnos/${ci}`, cuerpo);
  }

  /** Siempre permitido. */
  inhabilitar(ci: number): Observable<Alumno> {
    return this.api.patch<Alumno>(`/alumnos/${ci}/inhabilitar`);
  }

  /** Falla con 409 `GRUPO_INHABILITADO` si el grupo del alumno está inhabilitado. */
  habilitar(ci: number): Observable<Alumno> {
    return this.api.patch<Alumno>(`/alumnos/${ci}/habilitar`);
  }
}
