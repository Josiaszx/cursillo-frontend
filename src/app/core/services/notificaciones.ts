import { Injectable, signal } from '@angular/core';

/** Tiempo que una notificación permanece visible antes de empezar a desvanecerse. */
export const DURACION_MENSAJE_MS = 2000;
/** Para mensajes que el usuario necesita leer con calma (varias frases). */
export const DURACION_MENSAJE_LARGO_MS = 5000;
/** Duración del desvanecimiento; debe coincidir con la transición de `app-notificaciones`. */
export const DESVANECER_MS = 400;

export interface Notificacion {
  id: number;
  texto: string;
  /** `true` mientras se desvanece, justo antes de quitarse. */
  saliendo: boolean;
}

/**
 * Avisos breves de operaciones correctas: una tarjeta abajo que se desvanece sola.
 * Los errores no pasan por aquí: se quedan visibles hasta que el usuario los cierra.
 */
@Injectable({ providedIn: 'root' })
export class Notificaciones {
  private readonly _items = signal<Notificacion[]>([]);
  readonly items = this._items.asReadonly();

  private siguienteId = 1;

  exito(texto: string, duracionMs = DURACION_MENSAJE_MS): void {
    const id = this.siguienteId++;
    this._items.update((lista) => [...lista, { id, texto, saliendo: false }]);

    setTimeout(() => {
      this._items.update((lista) => lista.map((n) => (n.id === id ? { ...n, saliendo: true } : n)));
      setTimeout(() => this._items.update((lista) => lista.filter((n) => n.id !== id)), DESVANECER_MS);
    }, duracionMs);
  }
}
