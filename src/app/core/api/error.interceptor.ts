import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiError } from './api-error';

/** Convierte cualquier fallo HTTP en un `ApiError` tipado. */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: unknown) =>
      throwError(() =>
        error instanceof HttpErrorResponse ? ApiError.desdeHttp(error) : ApiError.desde(error),
      ),
    ),
  );
