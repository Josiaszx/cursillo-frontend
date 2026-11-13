import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiError } from '../../core/api/api-error';
import { aplicarErroresServidor, mensajeError } from '../../core/forms/formularios';
import { Grupo } from '../../core/models';
import { Dialog } from '../../shared/ui/dialog';
import { GruposService } from './grupos.service';

/** Diálogo de alta y edición de grupos. Con `grupo` edita; sin él, crea. */
@Component({
  selector: 'app-grupo-form',
  imports: [ReactiveFormsModule, Dialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grupo-form.html',
})
export class GrupoForm implements OnInit {
  readonly grupo = input<Grupo | null>(null);
  readonly guardado = output<Grupo>();
  readonly cancelar = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(GruposService);

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    anioConvocatoria: this.fb.control<number | null>(null, [
      Validators.min(2000),
      Validators.max(2100),
    ]),
    numeroConvocatoria: this.fb.control<number | null>(null, [
      Validators.min(1),
      Validators.max(20),
    ]),
  });

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** Id del grupo inhabilitado que ya tiene esa clave, para ofrecer reactivarlo. */
  protected readonly existenteInhabilitado = signal<number | null>(null);

  ngOnInit(): void {
    const g = this.grupo();
    if (g) {
      this.form.patchValue({
        nombre: g.nombre,
        anioConvocatoria: g.anioConvocatoria,
        numeroConvocatoria: g.numeroConvocatoria,
      });
    }
  }

  protected mensaje(campo: 'nombre' | 'anioConvocatoria' | 'numeroConvocatoria'): string | null {
    return mensajeError(this.form.controls[campo]);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.existenteInhabilitado.set(null);

    const valores = this.form.getRawValue();
    const cuerpo = { ...valores, nombre: valores.nombre.trim() };
    const actual = this.grupo();
    const peticion = actual
      ? this.service.editar(actual.id, cuerpo)
      : this.service.crear(cuerpo);

    peticion.subscribe({
      next: (grupo) => {
        this.enviando.set(false);
        this.guardado.emit(grupo);
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        const err = ApiError.desde(e);
        if (aplicarErroresServidor(this.form, err)) return;
        if (err.codigo === 'YA_EXISTE_INHABILITADO' && !actual) {
          this.existenteInhabilitado.set(Number(err.detalles['id']));
        }
        this.error.set(err.message);
      },
    });
  }

  /** Reactiva el grupo inhabilitado existente. Conserva sus datos anteriores. */
  protected reactivar(): void {
    const id = this.existenteInhabilitado();
    if (id === null) return;
    this.enviando.set(true);
    this.service.habilitar(id).subscribe({
      next: (grupo) => {
        this.enviando.set(false);
        this.guardado.emit(grupo);
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        this.existenteInhabilitado.set(null);
        this.error.set(ApiError.desde(e).message);
      },
    });
  }
}
