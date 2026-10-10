import { Component, computed, inject, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { PrestamoService } from '../../../services/prestamo.service';
import { PrestamoResponse } from '../../../models/prestamo.model';
import { AbonoPrestamoForm } from '../abono-prestamo-form/abono-prestamo-form';
import { ModalComponent } from '../../modal/modal';
import { ConfirmModalComponent } from '../../confirm-modal/confirm-modal';

@Component({
  selector: 'app-prestmos-list',
  standalone: true,
  imports: [
    CommonModule,
    AbonoPrestamoForm,
    ModalComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './prestamos-list.html',
  styleUrl: './prestamos-list.css',
})
export class PrestamosList implements OnInit {
  private readonly prestamoService = inject(PrestamoService);

  colaboradorId = input.required<number>();
  colaboradorNombre = input<string>('');
  colaboradorPuesto = input<string>('');
  colaboradorUbicacion = input<string>('');
  colaboradorFotografia = input<string | null>(null);

  // ---------- Datos ----------
  prestamos = signal<PrestamoResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  /** Fallback de la foto del colaborador */
  private readonly fotoFallida = signal(false);

  // ---------- Modal abono ----------
  modalAbonoAbierto = signal(false);
  prestamoParaAbonar = signal<PrestamoResponse | null>(null);

  // ---------- Modal cancelar ----------
  modalCancelarAbierto = signal(false);
  prestamoParaCancelar = signal<PrestamoResponse | null>(null);
  cancelando = signal(false);

  // ---------- Computed del avatar ----------
  mostrarAvatar = computed(() => {
    const path = this.colaboradorFotografia();
    if (!path || path.trim() === '' || path === 'no disponible') return true;
    return this.fotoFallida();
  });

  iniciales = computed(() => {
    const limpio = this.colaboradorNombre()?.trim() ?? '';
    if (!limpio) return '?';
    const partes = limpio.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  });

  onFotoError(): void {
    this.fotoFallida.set(true);
  }

  // ---------- Totales ----------
  totales = computed(() => {
    const lista = this.prestamos();
    return {
      total: lista.length,
      montoOriginal: lista.reduce((sum, p) => sum + this.totalOriginalDe(p), 0),
      pagado: lista.reduce((sum, p) => sum + (p.montoPagado ?? 0), 0),
      pendiente: lista.reduce((sum, p) => sum + (p.monto ?? 0), 0),
    };
  });

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarPrestamos();
  }

  private cargarPrestamos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.prestamoService
      .getPrestamosByColaboradorId(this.colaboradorId())
      .subscribe({
        next: (data) => {
          this.prestamos.set(data);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al cargar préstamos', err);
          this.error.set('No se pudieron cargar los préstamos.');
          this.loading.set(false);
        },
      });
  }

  recargar(): void {
    this.cargarPrestamos();
  }

  // ---------- Modal abono ----------
  abrirModalAbono(p: PrestamoResponse): void {
    this.prestamoParaAbonar.set(p);
    this.modalAbonoAbierto.set(true);
  }

  cerrarModalAbono(): void {
    this.modalAbonoAbierto.set(false);
    this.prestamoParaAbonar.set(null);
  }

  onAbonoAplicado(): void {
    this.modalAbonoAbierto.set(false);
    this.prestamoParaAbonar.set(null);
    this.recargar();
  }

  // ---------- Modal cancelar ----------
  abrirModalCancelar(p: PrestamoResponse): void {
    this.prestamoParaCancelar.set(p);
    this.modalCancelarAbierto.set(true);
  }

  cerrarModalCancelar(): void {
    if (this.cancelando()) return;
    this.modalCancelarAbierto.set(false);
    this.prestamoParaCancelar.set(null);
  }

  confirmarCancelar(): void {
    const p = this.prestamoParaCancelar();
    if (!p) return;

    this.cancelando.set(true);

    this.prestamoService.cancelarPrestamo(p.id).subscribe({
      next: () => {
        this.cancelando.set(false);
        this.modalCancelarAbierto.set(false);
        this.prestamoParaCancelar.set(null);
        this.recargar();
      },
      error: (err) => {
        console.error('Error al cancelar préstamo', err);
        this.cancelando.set(false);
      },
    });
  }

  // ---------- Helpers de formato ----------
  formatoMonto(valor: number | null | undefined): string {
    if (valor == null) return '—';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 2,
    }).format(valor);
  }

  // ---------- Helpers de cálculo ----------
  totalOriginalDe(p: PrestamoResponse): number {
    return (p.monto ?? 0) + (p.montoPagado ?? 0);
  }

  porcentajePagado(p: PrestamoResponse): number {
    const total = this.totalOriginalDe(p);
    if (total === 0) return 0;
    const pagado = p.montoPagado ?? 0;
    return Math.min(100, Math.round((pagado / total) * 100));
  }

  // ---------- Clases CSS ----------
  estatusClase(estatus: string | null | undefined): string {
    const e = (estatus ?? '').toUpperCase();
    if (e.includes('PAGADO') || e.includes('LIQUIDADO')) return 'badge badge--ok';
    if (e.includes('CANCELADO')) return 'badge badge--danger';
    if (e.includes('PARCIAL')) return 'badge badge--parcial';
    if (e.includes('PRESTADO') || e.includes('PENDIENTE') || e.includes('ACTIVO'))
      return 'badge badge--info';
    return 'badge';
  }

  labelEstatus(estatus: string | null | undefined): string {
    return estatus ?? '—';
  }
}