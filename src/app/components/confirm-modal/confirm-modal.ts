import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (abierto()) {
      <div class="modal-backdrop" (click)="onCancelar()">
        <div class="modal" (click)="$event.stopPropagation()">
          <header class="modal__head">
            <h4 class="modal__title">{{ titulo() }}</h4>
            <button
              type="button"
              class="modal__close"
              (click)="onCancelar()"
              [disabled]="procesando()"
              aria-label="Cerrar"
            >✕</button>
          </header>

          <div class="modal__body">
            <p class="confirm-text">{{ mensaje() }}</p>

            @if (detalle()) {
              <div class="confirm-box">{{ detalle() }}</div>
            }
          </div>

          <footer class="modal__foot">
            <button
              type="button"
              class="btn btn--ghost"
              (click)="onCancelar()"
              [disabled]="procesando()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn--danger-solid"
              (click)="onConfirmar()"
              [disabled]="procesando()"
            >
              @if (procesando()) { Procesando… } @else { {{ textoConfirmar() }} }
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(11, 27, 63, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1000;
    }
    .modal {
      background-color: var(--color-surface);
      border: 1px solid var(--color-line);
      border-radius: 1rem;
      width: 100%;
      max-width: 460px;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .modal__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--color-line);
    }
    .modal__title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-ink);
      margin: 0;
    }
    .modal__close {
      background: transparent;
      border: none;
      color: var(--color-ink-soft);
      font-size: 1rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
    }
    .modal__body {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .modal__foot {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--color-line);
    }
    .confirm-text {
      font-size: 0.875rem;
      color: var(--color-ink);
      margin: 0;
    }
    .confirm-box {
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--color-line);
      border-radius: 0.5rem;
      background-color: var(--color-brand-softer);
      font-size: 0.8125rem;
      color: var(--color-ink-soft);
    }
    .btn {
      height: 38px;
      padding: 0 1rem;
      border-radius: 0.5rem;
      border: 1px solid transparent;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
    }
    .btn--ghost {
      background-color: transparent;
      color: var(--color-ink-soft);
      border-color: var(--color-line);
    }
    .btn--danger-solid {
      background-color: #c0392b;
      color: #fff;
      border-color: #c0392b;
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `],
})
export class ConfirmModalComponent {
  abierto = input.required<boolean>();
  titulo = input('Confirmar');
  mensaje = input('¿Seguro?');
  detalle = input<string | null>(null);
  textoConfirmar = input('Eliminar');
  procesando = input(false);

  confirmar = output<void>();
  cancelar = output<void>();

  onConfirmar(): void {
    this.confirmar.emit();
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}