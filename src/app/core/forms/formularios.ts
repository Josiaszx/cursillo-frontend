import { AbstractControl, FormGroup } from '@angular/forms';

import { ApiError } from '../api/api-error';

/**
 * Mensaje de error de un control, listo para mostrar junto al campo.
 * Prioriza el error del servidor; los de validación local solo se muestran
 * después de tocar el campo.
 */
export function mensajeError(control: AbstractControl | null): string | null {
  const errores = control?.errors;
  if (!control || !errores) return null;
  if (errores['servidor']) return String(errores['servidor']);
  if (!control.touched && !control.dirty) return null;
  if (errores['required']) return 'Es obligatorio.';
  if (errores['maxlength']) return `Hasta ${errores['maxlength'].requiredLength} caracteres.`;
  if (errores['email']) return 'No es un correo válido.';
  if (errores['min']) return `El valor mínimo es ${errores['min'].min}.`;
  if (errores['max']) return `El valor máximo es ${errores['max'].max}.`;
  return 'Valor no válido.';
}

/**
 * Pinta en cada campo el error de un 400 `VALIDACION`. Devuelve `true` si al menos
 * un campo recibió mensaje (las claves vienen en camelCase, igual que los controles).
 */
export function aplicarErroresServidor(form: FormGroup, error: ApiError): boolean {
  let aplicado = false;
  for (const [campo, mensajes] of Object.entries(error.erroresPorCampo)) {
    const control = form.get(campo);
    if (!control || mensajes.length === 0) continue;
    control.setErrors({ servidor: mensajes[0] });
    control.markAsTouched();
    aplicado = true;
  }
  return aplicado;
}
