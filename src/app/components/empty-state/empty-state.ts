import { Component, Input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col items-center justify-center text-center w-full"
      [class.py-10]="!compact"
      [class.px-4]="!compact"
      [class.py-6]="compact"
    >
      @if (image) {
        <img
          [src]="image"
          [alt]="title || 'Sin datos'"
          class="mb-3 select-none pointer-events-none"
          [style.width.px]="compact ? imageSize * 0.6 : imageSize"
          [style.height.px]="compact ? imageSize * 0.6 : imageSize"
        />
      }

      @if (title) {
        <h3
          class="font-semibold"
          [class.text-base]="!compact"
          [class.text-sm]="compact"
          style="color: var(--color-ink)"
        >
          {{ title }}
        </h3>
      }

      @if (description && !compact) {
        <p class="mt-1 text-sm max-w-sm" style="color: var(--color-ink-soft)">
          {{ description }}
        </p>
      }

      @if (actionLabel) {
        <button
          type="button"
          (click)="action.emit()"
          class="mt-4 rounded-lg px-4 py-2 text-sm font-medium"
          style="background: var(--color-brand); color:#fff"
        >
          {{ actionLabel }}
        </button>
      }

      <ng-content></ng-content>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() image?: string;
  @Input() imageSize = 140;
  @Input() title?: string;
  @Input() description?: string;
  @Input() actionLabel?: string;
  @Input() compact = false;
  action = output<void>();
}