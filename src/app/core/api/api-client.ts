import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_URL } from '../config/api-url';

export type Parametros = Record<string, string | number | boolean | null | undefined>;

/**
 * Único punto de salida HTTP de la app. Cuando llegue la autenticación,
 * el token se añade aquí (o en un interceptor) y no en cada pantalla.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);

  get<T>(ruta: string, parametros?: Parametros): Observable<T> {
    return this.http.get<T>(this.url(ruta), { params: this.params(parametros) });
  }

  post<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.post<T>(this.url(ruta), cuerpo);
  }

  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<T>(this.url(ruta), cuerpo);
  }

  patch<T>(ruta: string, parametros?: Parametros): Observable<T> {
    return this.http.patch<T>(this.url(ruta), null, { params: this.params(parametros) });
  }

  private url(ruta: string): string {
    return `${this.base}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
  }

  /** Omite los parámetros vacíos: la API no admite `""` como valor opcional. */
  private params(parametros?: Parametros): HttpParams {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(parametros ?? {})) {
      if (valor === null || valor === undefined || valor === '') continue;
      params = params.set(clave, String(valor));
    }
    return params;
  }
}
