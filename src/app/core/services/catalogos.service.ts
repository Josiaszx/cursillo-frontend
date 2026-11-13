import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { ApiClient } from '../api/api-client';
import { ItemCatalogo } from '../models';

/** Catálogos de solo lectura. Cambian muy poco, así que se piden una sola vez. */
@Injectable({ providedIn: 'root' })
export class CatalogosService {
  private readonly api = inject(ApiClient);

  /** 1 examen · 2 teoria · 3 practica · 4 teoria/practica */
  readonly tiposClase$: Observable<ItemCatalogo[]> = this.api
    .get<ItemCatalogo[]>('/tipos-clase')
    .pipe(shareReplay({ bufferSize: 1, refCount: false }));
}
