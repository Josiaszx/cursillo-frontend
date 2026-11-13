import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiError } from '../../core/api/api-error';
import { aplicarErroresServidor, mensajeError } from '../../core/forms/formularios';
import { Alumno } from '../../core/models';
import { nombreCompleto } from '../../core/util/formato';
import { Dialog } from '../../shared/ui/dialog';
import { GruposService } from '../grupos/grupos.service';
import { AlumnosService } from './alumnos.service';

/** Los opcionales vacíos viajan como `null`, nunca como `""`. */
const vacioANull = (valor: string): string | null => (valor.trim() === '' ? null : valor.trim());

/** Diálogo de alta y edición de alumnos. Con `alumno` edita; sin él, crea. */
@Component({
  selector: 'app-alumno-form',
  imports: [ReactiveFormsModule, Dialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alumno-form.html',
  styleUrl: './alumno-form.scss',
})
export class AlumnoForm implements OnInit {
  readonly alumno = input<Alumno | null>(null);
  readonly guardado = output<Alumno>();
  readonly cancelar = output<void>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(AlumnosService);
  private readonly gruposService = inject(GruposService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly form = this.fb.group({
    ci: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    nombres: ['', [Validators.required, Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.maxLength(100)]],
    edad: this.fb.control<number | null>(null, [Validators.min(5), Validators.max(120)]),
    correo: ['', [Validators.email, Validators.maxLength(150)]],
    telefono: ['', [Validators.maxLength(30)]],
    grupoId: this.fb.control<number | null>(null, [Validators.required]),
  });

  /** Para elegir grupo solo se ofrecen los habilitados. */
  protected readonly grupos = rxResource({
    stream: () => this.gruposService.listar('habilitados'),
  });

  /**
   * Opciones del selector. Al editar un alumno cuyo grupo está inhabilitado, ese grupo
   * se añade para poder conservarlo (la API solo valida el grupo si cambia).
   */
  protected readonly opcionesGrupo = computed(() => {
    const opciones = (this.grupos.value() ?? []).map((g) => ({ id: g.id, etiqueta: g.nombre }));
    const actual = this.alumno()?.grupo;
    if (actual && !opciones.some((o) => o.id === actual.id)) {
      opciones.unshift({ id: actual.id, etiqueta: `${actual.nombre} (inhabilitado)` });
    }
    return opciones;
  });

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  /** CI del alumno inhabilitado que ya tiene esa clave, para ofrecer reactivarlo. */
  protected readonly existenteInhabilitado = signal<number | null>(null);

  /** `true` mientras se comprueba si el CI ya existe. */
  protected readonly verificandoCi = signal(false);

  ngOnInit(): void {
    const a = this.alumno();
    if (!a) {
      // Al editar el CI, el resultado de la comprobación anterior deja de valer.
      this.form.controls.ci.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.existenteInhabilitado.set(null);
          this.verificandoCi.set(false);
        });
      return;
    }
    this.form.patchValue({
      ci: a.ci,
      nombres: a.nombres,
      apellidos: a.apellidos,
      edad: a.edad,
      correo: a.correo ?? '',
      telefono: a.telefono ?? '',
      grupoId: a.grupo.id,
    });
    // El CI no se puede cambiar una vez creado.
    this.form.controls.ci.disable();
  }

  protected mensaje(campo: string): string | null {
    return mensajeError(this.form.get(campo));
  }

  /**
   * Al salir del campo CI (solo al crear) comprueba si ya existe un alumno con ese CI.
   * Usa `GET /alumnos/{ci}`: devuelve el registro aunque esté inhabilitado y 404 si el CI
   * está libre. Cualquier otro fallo se ignora: al guardar, el backend lo validará igual
   * (409 `YA_EXISTE` / `YA_EXISTE_INHABILITADO`).
   */
  protected verificarCi(): void {
    if (this.alumno()) return;
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
            servidor: `Ya existe un alumno con este CI: ${nombreCompleto(existente)} (${existente.grupo.nombre}).`,
          });
        } else {
          control.setErrors({
            servidor: `Ya existe un alumno inhabilitado con este CI: ${nombreCompleto(existente)}.`,
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
      grupoId: v.grupoId!,
    };
    const actual = this.alumno();
    const peticion = actual
      ? this.service.editar(actual.ci, cuerpo)
      : this.service.crear({ ci: v.ci!, ...cuerpo });

    peticion.subscribe({
      next: (alumno) => {
        this.enviando.set(false);
        this.guardado.emit(alumno);
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

  /** Reactiva al alumno inhabilitado existente. Conserva sus datos anteriores. */
  protected reactivar(): void {
    const ci = this.existenteInhabilitado();
    if (ci === null) return;
    this.enviando.set(true);
    this.service.habilitar(ci).subscribe({
      next: (alumno) => {
        this.enviando.set(false);
        this.guardado.emit(alumno);
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        this.existenteInhabilitado.set(null);
        // p. ej. GRUPO_INHABILITADO: su grupo anterior sigue inhabilitado.
        this.error.set(ApiError.desde(e).message);
      },
    });
  }
}
