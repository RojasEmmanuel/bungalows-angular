import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NominaResumenResponse } from '../../../models/nomina.model';

@Component({
  selector: 'app-nomina-resumen-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nomina-resumen-cards.html',
  styleUrl: './nomina-resumen-cards.css',
})
export class NominaResumenCards {
  @Input({ required: true }) resumen!: NominaResumenResponse;
  @Input() cargando = false;

  formatoMoneda(v: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(v ?? 0);
  }

  get totalDeducciones(): number {
    return (this.resumen?.descuentos ?? 0) + (this.resumen?.retenciones ?? 0);
  }
}