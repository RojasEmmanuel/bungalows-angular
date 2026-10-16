import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { NominaService } from '../../../services/nomina.service';
import {
  NominaDetalleResponse,
  PercepcionResponse,
  DeduccionResponse,
} from '../../../models/nomina.model';

@Component({
  selector: 'app-nomina-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nomina-detalle.html',
  styleUrl: './nomina-detalle.css',
})
export class NominaDetalleComponent implements OnInit {
  private nominaService = inject(NominaService);

  @Input({ required: true }) nominaId!: number;

  detalle = signal<NominaDetalleResponse | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);

  descargandoPdf = signal(false);   // ← nuevo

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.nominaService
      .getDetalle(this.nominaId)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (d) => this.detalle.set(d),
        error: (err) => {
          console.error('Error al cargar detalle de nómina', err);
          this.error.set('No se pudo cargar el detalle de la nómina.');
        },
      });
  }

  // ── Descarga de PDF
  descargarPdf(): void {
    if (this.descargandoPdf()) return;
    this.descargandoPdf.set(true);

    this.nominaService
      .descargarPdf(this.nominaId)
      .pipe(finalize(() => this.descargandoPdf.set(false)))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 30_000);
        },
        error: (err) => {
          console.error('Error al descargar PDF', err);
        },
      });
  }

  formatoMoneda(v: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(v ?? 0);
  }

  formatoFecha(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}