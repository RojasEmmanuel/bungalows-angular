import { Component, computed, input, signal } from '@angular/core';
import { AntiguedadesProximas } from '../../models/laboral.model';

@Component({
  selector: 'app-antiguedad-proxima-card',
  standalone: true,
  templateUrl: './antiguedad-proxima-card.html',
  styleUrl: './antiguedad-proxima-card.css',
})
export class AntiguedadProximaCardComponent {
  antiguedad = input.required<AntiguedadesProximas>();

  private readonly imageFailed = signal(false);

  /** ¿Debemos mostrar el avatar de iniciales? */
  showAvatar = computed(() => {
    const path = this.antiguedad().fotografia;
    if (!path || path.trim() === '' || path === 'no disponible') return true;
    return this.imageFailed();
  });

  /** Iniciales a partir del nombre: "Emmanuel Rojas" → "ER" */
  iniciales = computed(() => {
    const nombre = this.antiguedad().nombreColaborador?.trim() ?? '';
    if (!nombre) return '?';
    const partes = nombre.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  });

  onImageError(): void {
    this.imageFailed.set(true);
  }
}