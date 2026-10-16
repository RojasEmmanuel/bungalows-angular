import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NominaListadoResponse } from '../../../models/nomina.model';

@Component({
  selector: 'app-nomina-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nomina-item.html',
  styleUrl: './nomina-item.css',
})
export class NominaItemComponent {
  @Input({ required: true }) nomina!: NominaListadoResponse;
  @Input() etiquetaPeriodo = '';
  @Output() seleccionar = new EventEmitter<number>();

  /** Imagen de error (evita loop si la URL falla) */
  fotoRota = false;

  /** true si hay foto y no ha fallado la carga */
  get tieneFoto(): boolean {
    return !!this.nomina.fotografia && !this.fotoRota;
  }

  formatoMoneda(v: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(v ?? 0);
  }

  iniciales(nombre: string): string {
    return (nombre ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  onFotoError(): void {
    this.fotoRota = true;
  }
}