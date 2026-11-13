import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Notificaciones as NotificacionesService } from '../../core/services/notificaciones';
import { Icon } from './icon';

/** Contenedor de las tarjetas de aviso. Se monta una sola vez, en el shell. */
@Component({
  selector: 'app-notificaciones',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="contenedor" role="status" aria-live="polite">
      @for (n of servicio.items(); track n.id) {
        <div class="tarjeta" [class.saliendo]="n.saliendo">
          <app-icon nombre="check" [tamano]="18" />
          <span>{{ n.texto }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    .contenedor {
      position: fixed;
      left: 50%;
      bottom: 24px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: max-content;
      max-width: calc(100vw - 32px);
      transform: translateX(-50%);
      pointer-events: none;
    }
    .tarjeta {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: var(--radio-md);
      background: var(--color-sidebar);
      color: #fff;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 24px rgb(20 40 75 / 30%);
      opacity: 1;
      transition:
        opacity 0.4s ease,
        transform 0.4s ease;
      animation: entrar 0.2s ease-out;
    }
    .tarjeta app-icon {
      color: #7fd1ac;
    }
    .tarjeta.saliendo {
      opacity: 0;
      transform: translateY(6px);
    }
    @keyframes entrar {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .tarjeta {
        animation: none;
        transition: opacity 0.4s ease;
      }
    }
  `,
})
export class NotificacionesComponent {
  protected readonly servicio = inject(NotificacionesService);
}
