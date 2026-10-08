import { Component, HostListener, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class ModalComponent {
  titulo = input<string>('');
  abierto = input<boolean>(false);
  cerrar = output<void>();

  onBackdropClick(): void {
    this.cerrar.emit();
  }

  onContenidoClick(event: MouseEvent): void {
    // Evita que el click dentro del contenido cierre el modal
    event.stopPropagation();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.abierto()) this.cerrar.emit();
  }
}