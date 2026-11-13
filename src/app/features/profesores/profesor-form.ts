import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiError } from '../../core/api/api-error';
import { aplicarErroresServidor, mensajeError } from '../../core/forms/formularios';
import { Profesor } from '../../core/models';
import { nombreCompleto } from '../../core/util/formato';
import { Dialog } from '../../shared/ui/dialog';
import { ProfesoresService } from './profesores.service';

/** Los opcionales vacíos viajan como `null`, nunca como `""`. */
const vacioANull = (valor: string): string | null => (valor.trim() === '' ? null : valor.trim());

/** Diálogo de alta y edición de profesores. Con `profesor` edita; sin él, crea. */
@Component({
  selector: 'app-profesor-form',
  imports: [ReactiveFormsModule, Dialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profesor-form.html',
  styleUrl: './profesor-form.scss',
})
export class ProfesorForm implements OnInit {
  readonly profesor = input<Profesor | null>(null);
  readonly guardado = output<Profesor>();
  readonly cancelar = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(ProfesoresService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    ci: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    edad: this.fb.control<number | null>(null, [Validators.min(5), Validators.max(120)]),
    correo: ['', [Validators.email, Validators.maxLength(150)]],
    telefono: ['', [Validators.maxLength(30)]],
  });

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** CI del profesor inhabilitado que ya tiene esa clave, para ofrecer reactivarlo. */
  protected readonly existenteInhabilitado = signal<number | null>(null);
  /** `true` mientras se comprueba si el CI ya existe. */
  protected readonly verificandoCi = signal(false);

  ngOnInit(): void {
    const p = this.profesor();
    if (!p) {
      // Al editar el CI, el resultado de la comprobación anterior deja de valer.
      this.form.controls.ci.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.existenteInhabilitado.set(null);
        this.verificandoCi.set(false);
      });
      return;
    }
    this.form.patchValue({
      ci: p.ci,
      nombres: p.nombres,
      apellidos: p.apellidos,
      edad: p.edad,
      correo: p.correo ?? '',
      telefono: p.telefono ?? '',
    });
    // El CI no se puede cambiar una vez creado.
    this.form.controls.ci.disable();
  }

  protected mensaje(campo: string): string | null {
    return mensajeError(this.form.get(campo));
  }

  /**
   * Al salir del campo CI (solo al crear) comprueba si ya existe un profesor con ese CI.
   * `GET /profesores/{ci}` devuelve el registro aunque esté inhabilitado y 404 si está libre.
   * Cualquier otro fallo se ignora: al guardar, el backend lo validará igual.
   */
  protected verificarCi(): void {
    if (this.profesor()) return;
    const control = this.form.controls.ci;
    const ci = control.value;
    if (ci === null || control.invalid) return;

    this.verificandoCi.set(true);
    this.service.obtener(ci).subscribe({
      next: (existente) => {
        // Si el usuario ya cambió el CI mientras tanto, la respuesta no aplica.
        if (control.value !== ci) return;
        this.verificandoCi.set(false);
        if (existente.habilitado) {
          control.setErrors({
            servidor: `Ya existe un profesor con este CI: ${nombreCompleto(existente)}.`,
          });
        } else {
          control.setErrors({
            servidor: `Ya existe un profesor inhabilitado con este CI: ${nombreCompleto(existente)}.`,
          });
          this.existenteInhabilitado.set(existente.ci);
        }
        control.markAsTouched();
      },
      error: () => {
        if (control.value === ci) this.verificandoCi.set(false);
      },
    });
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    this.existenteInhabilitado.set(null);

    const v = this.form.getRawValue();
    const cuerpo = {
      nombres: v.nombres.trim(),
      apellidos: v.apellidos.trim(),
      edad: v.edad,
      correo: vacioANull(v.correo),
      telefono: vacioANull(v.telefono),
    };
    const actual = this.profesor();
    const peticion = actual
      ? this.service.editar(actual.ci, cuerpo)
      : this.service.crear({ ci: v.ci!, ...cuerpo });

    peticion.subscribe({
      next: (profesor) => {
        this.enviando.set(false);
        this.guardado.emit(profesor);
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

  /** Reactiva al profesor inhabilitado existente. Conserva sus datos anteriores. */
  protected reactivar(): void {
    const ci = this.existenteInhabilitado();
    if (ci === null) return;
    this.enviando.set(true);
    this.service.habilitar(ci).subscribe({
      next: (profesor) => {
        this.enviando.set(false);
        this.guardado.emit(profesor);
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        this.existenteInhabilitado.set(null);
        this.error.set(ApiError.desde(e).message);
      },
    });
  }
}
