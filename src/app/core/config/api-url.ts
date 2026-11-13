import { InjectionToken } from '@angular/core';

/** URL base de la API (desarrollo). Se puede sobrescribir en `app.config.ts` o en los tests. */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:5082',
});
