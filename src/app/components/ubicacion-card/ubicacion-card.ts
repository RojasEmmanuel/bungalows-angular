import { Component, computed, input, signal } from '@angular/core';
import { UbicacionDetail } from '../../models/ubicacion.model';

@Component({
  selector: 'app-ubicacion-card',
  standalone: true,
  templateUrl: './ubicacion-card.html',
  styleUrl: './ubicacion-card.css',
})
export class UbicacionCardComponent {
  ubicacion = input.required<UbicacionDetail>();

  imageFailed = signal(false);

  showAvatar = computed(() => {
    const path = this.ubicacion().imagenPath;
    return !path || path.trim() === '' || this.imageFailed();
  });

  iniciales = computed(() => {
    const nombre = this.ubicacion().nombre?.trim() ?? '';
    if (!nombre) return '?';

    const palabras = nombre.split(/\s+/).filter(Boolean);

    if (palabras.length === 1) {
      return palabras[0].substring(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  });

  onImageError(): void {
    this.imageFailed.set(true);
  }
}