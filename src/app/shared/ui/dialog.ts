import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { Icon } from './icon';

/**
 * Diálogo modal sobre `<dialog>` nativo (foco atrapado y Esc gratis).
 * Se muestra al crearse: el padre lo pone/quita con `@if`.
 * Emite `cerrar` cuando el usuario lo cierra (botón X o Esc). Un clic fuera del diálogo
 * NO lo cierra: así no se pierde lo escrito por un clic accidental.
 */
/** Contador para dar a cada diálogo un id de título único (`aria-labelledby`). */
let contadorDialogos = 0;

@Component({
  selector: 'app-dialog',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dlg [attr.aria-labelledby]="idTitulo" (close)="cerrar.emit()">
      <header class="hd">
        <h2 [id]="idTitulo">{{ titulo() }}</h2>
        <button class="x" type="button" aria-label="Cerrar" (click)="dlg.close()">
          <app-icon nombre="x" [tamano]="18" />
        </button>
      </header>
      <div class="bd"><ng-content /></div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(520px, calc(100vw - 32px));
      max-height: calc(100dvh - 32px);
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 0;
      border: 0;
      border-radius: var(--radio-lg);
      background: var(--color-superficie);
      color: var(--color-texto);
      box-shadow: 0 20px 50px rgb(20 40 75 / 30%);
    }
    dialog::backdrop {
      background: rgb(20 40 75 / 45%);
    }
    .hd {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 20px 24px 0;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
    }
    .x {
      display: flex;
      padding: 6px;
      border: 0;
      border-radius: var(--radio-sm);
      background: transparent;
      color: var(--color-texto-suave);
      cursor: pointer;
    }
    .x:hover {
      background: var(--color-fondo);
    }
    .bd {
      padding: 16px 24px 24px;
    }
  `,
})
export class Dialog implements AfterViewInit {
  readonly titulo = input.required<string>();
  protected readonly idTitulo = `dialogo-titulo-${++contadorDialogos}`;
  readonly cerrar = output<void>();

  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    this.dlg().nativeElement.showModal();
    this.bloquearScrollDePagina();
  }

  /**
   * Mientras el diálogo está abierto la página de fondo no hace scroll: la rueda dentro del
   * formulario no debe moverla. Se restaura al destruirse el componente (cerrar o `@if`).
   */
  private bloquearScrollDePagina(): void {
    const html = this.document.documentElement;
    const anterior = html.style.overflow;
    html.style.overflow = 'hidden';
    this.destroyRef.onDestroy(() => (html.style.overflow = anterior));
  }
}
