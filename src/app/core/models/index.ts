/** Modelos de las respuestas de la API (sección 5 de API_FRONTEND.md). */

export interface ItemCatalogo {
  id: number;
  nombre: string;
}

export type EstadoFiltro = 'habilitados' | 'inhabilitados' | 'todos';

export interface Grupo {
  id: number;
  nombre: string;
  anioConvocatoria: number | null;
  numeroConvocatoria: number | null;
  /** Alumnos habilitados del grupo; lo calcula el servidor. */
  cantidadAlumnos: number;
  habilitado: boolean;
}

export interface GrupoRef {
  id: number;
  nombre: string;
  habilitado: boolean;
}

export interface Profesor {
  ci: number;
  nombres: string;
  apellidos: string;
  edad: number | null;
  correo: string | null;
  telefono: string | null;
  habilitado: boolean;
}

export interface ProfesorRef {
  ci: number;
  nombres: string;
  apellidos: string;
  habilitado: boolean;
}

export interface Alumno {
  ci: number;
  nombres: string;
  apellidos: string;
  edad: number | null;
  correo: string | null;
  telefono: string | null;
  grupo: GrupoRef;
  habilitado: boolean;
}

export interface AulaRef {
  id: number;
  nombre: string;
}

export interface Clase {
  id: number;
  /** "2024-07-31" */
  fecha: string | null;
  /** "09:00:00" */
  horaInicio: string | null;
  horaFin: string | null;
  aula: AulaRef | null;
  grupo: GrupoRef | null;
  tipoClase: ItemCatalogo | null;
  profesor: ProfesorRef | null;
  habilitado: boolean;
}

export interface Paginado<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

/** Respuesta de `PATCH /grupos/{id}/inhabilitar`. */
export interface ResultadoInhabilitarGrupo {
  grupo: Grupo;
  afectados: { alumnos: number; clases: number };
}
