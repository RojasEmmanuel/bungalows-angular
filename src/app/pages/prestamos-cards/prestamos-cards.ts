import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { PrestamoService } from '../../services/prestamo.service';
import { DeudaResponse } from '../../models/prestamo.model';
import { AbonoForm } from '../../components/prestamo/abono-form/abono-form';
import { ModalComponent } from '../../components/modal/modal';
import { PrestamosForm } from '../../components/prestamo/prestamos-form/prestamos-form';
import { PrestamosList } from '../../components/prestamo/prestamos-list/prestamos-lis';

@Component({
  selector: 'app-prestamos-cards',
  standalone: true,
  imports: [CommonModule, FormsModule, AbonoForm, ModalComponent, PrestamosList, PrestamosForm],
  templateUrl: './prestamos-cards.html',
  styleUrl: './prestamos-cards.css',
})
export class PrestamosCards implements OnInit {
  private readonly prestamoService = inject(PrestamoService);

  // ---------- Datos crudos ----------
  deudas = signal<DeudaResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
    modalNuevoPrestamoAbierto = signal(false);


  // ---------- Búsqueda ----------
  busqueda = signal('');

  // ---------- Imágenes fallidas ----------
  private readonly failedImages = signal<Set<number>>(new Set());

  // ---------- Resultado filtrado ----------
  deudasFiltradas = computed(() => {
    const term = this.busqueda().trim().toLowerCase();
    if (!term) return this.deudas();

    return this.deudas().filter(
      (d) =>
        d.colaborador?.toLowerCase().includes(term) ||
        d.puesto?.toLowerCase().includes(term) ||
        d.ubicacion?.toLowerCase().includes(term)
    );
  });

  // ---------- Totales globales ----------
  totales = computed(() => {
    const lista = this.deudas();
    return {
      colaboradores: lista.length,
      prestado: lista.reduce((sum, d) => sum + (d.prestado ?? 0), 0),
      pagado: lista.reduce((sum, d) => sum + (d.pagado ?? 0), 0),
      pendiente: lista.reduce((sum, d) => sum + (d.pendiente ?? 0), 0),
    };
  });

  // ---------- Auxiliares ----------
  hayFiltrosActivos = computed(() => !!this.busqueda().trim());
  hayResultados = computed(() => this.deudasFiltradas().length > 0);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarDeudas();
  }

  // ---------- Carga ----------
  private cargarDeudas(): void {
    this.loading.set(true);
    this.error.set(null);

    this.prestamoService.getDeudas().subscribe({
      next: (data) => {
        this.deudas.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar deudas', err);
        this.error.set('No se pudieron cargar las deudas.');
        this.loading.set(false);
      },
    });
  }

  // ---------- Handlers ----------
  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  recargar(): void {
    this.cargarDeudas();
  }


  // ---------- Avatar ----------
  iniciales(nombre: string | null | undefined): string {
    const limpio = nombre?.trim() ?? '';
    if (!limpio) return '?';
    const partes = limpio.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  showAvatar(d: DeudaResponse): boolean {
    const path = d.fotografia;
    if (!path || path.trim() === '' || path === 'no disponible') return true;
    return this.failedImages().has(d.colaboradorId);
  }

  onImageError(id: number): void {
    const actual = new Set(this.failedImages());
    actual.add(id);
    this.failedImages.set(actual);
  }

  // ---------- Helpers ----------
  formatoMonto(valor: number | null | undefined): string {
    if (valor == null) return '—';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 2,
    }).format(valor);
  }

  /** Porcentaje pagado sobre el total prestado */
  porcentajePagado(d: DeudaResponse): number {
    if (!d.prestado || d.prestado === 0) return 0;
    const pagado = d.pagado ?? 0;
    return Math.min(100, Math.round((pagado / d.prestado) * 100));
  }

 

  // ---------- Helpers ----------

  progresoClase(d: DeudaResponse): string {
    const pct = this.porcentajePagado(d);
    if (pct >= 100) return 'progreso__fill progreso__fill--full';
    if (pct >= 50) return 'progreso__fill progreso__fill--mid';
    return 'progreso__fill progreso__fill--low';
  }


  pendienteClase(d: DeudaResponse): string {
    const pendiente = d.pendiente ?? 0;
    return pendiente > 0 ? 'stat__value stat__value--brand' : 'stat__value';
  }

  modalAbonoAbierto = signal(false);
  deudaSeleccionada = signal<DeudaResponse | null>(null);
  abrirModalAbono(d: DeudaResponse): void {
    this.deudaSeleccionada.set(d);
    this.modalAbonoAbierto.set(true);
  }

  cerrarModalAbono(): void {
    this.modalAbonoAbierto.set(false);
    this.deudaSeleccionada.set(null);
  }

  onAbonoAplicado(): void {
    this.modalAbonoAbierto.set(false);
    this.deudaSeleccionada.set(null);
    this.recargar();   // recarga las deudas para ver el saldo actualizado
  }

   modalVerPrestamosAbierto = signal(false);
  colaboradorSeleccionado = signal<DeudaResponse | null>(null);

  verPrestamos(d: DeudaResponse): void {
    this.colaboradorSeleccionado.set(d);
    this.modalVerPrestamosAbierto.set(true);
  }

  cerrarModalVerPrestamos(): void {
    this.modalVerPrestamosAbierto.set(false);
    this.colaboradorSeleccionado.set(null);
    // Al cerrar, recargamos por si hubo cambios desde el listado interno
    this.recargar();
  }


   abrirModalNuevoPrestamo(): void {
    this.modalNuevoPrestamoAbierto.set(true);
  }

  cerrarModalNuevoPrestamo(): void {
    this.modalNuevoPrestamoAbierto.set(false);
  }

  onPrestamoCreado(): void {
    this.modalNuevoPrestamoAbierto.set(false);
    this.recargar();
  }
}