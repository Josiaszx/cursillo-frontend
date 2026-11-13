import { HttpErrorResponse } from '@angular/common/http';

/** Cuerpo de error que devuelve el backend (sección 3 de API_FRONTEND.md). */
export interface ErrorApi {
  codigo: string;
  mensaje: string;
  detalles: Record<string, unknown>;
}

/** Códigos propios del front, para fallos que no vienen del backend. */
export const CODIGO_RED = 'RED';
export const CODIGO_DESCONOCIDO = 'DESCONOCIDO';

/**
 * Error tipado de la API. La UI decide qué hacer según `codigo` (estable) y puede
 * mostrar `message` tal cual, porque ya viene en español.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensaje: string,
    readonly detalles: Record<string, unknown> = {},
  ) {
    super(mensaje);
    this.name = 'ApiError';
  }

  /** Errores por campo de un 400 `VALIDACION`: `{ campo: [mensajes] }`. Vacío en otros casos. */
  get erroresPorCampo(): Record<string, string[]> {
    if (this.codigo !== 'VALIDACION') return {};
    const resultado: Record<string, string[]> = {};
    for (const [campo, mensajes] of Object.entries(this.detalles)) {
      if (Array.isArray(mensajes)) resultado[campo] = mensajes.map(String);
    }
    return resultado;
  }

  static desdeHttp(error: HttpErrorResponse): ApiError {
    const cuerpo = error.error as Partial<ErrorApi> | null;
    if (cuerpo && typeof cuerpo.codigo === 'string') {
      return new ApiError(
        error.status,
        cuerpo.codigo,
        cuerpo.mensaje ?? 'Ocurrió un error.',
        cuerpo.detalles ?? {},
      );
    }
    if (error.status === 0) {
      return new ApiError(0, CODIGO_RED, 'No se pudo conectar con el servidor.');
    }
    return new ApiError(error.status, CODIGO_DESCONOCIDO, 'Ocurrió un error inesperado.');
  }

  /** Normaliza cualquier valor capturado en un `catch`/`error` a un `ApiError`. */
  static desde(error: unknown): ApiError {
    if (error instanceof ApiError) return error;
    return new ApiError(0, CODIGO_DESCONOCIDO, 'Ocurrió un error inesperado.');
  }
}
