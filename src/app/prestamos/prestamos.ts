import { Component, inject, signal, viewChild } from '@angular/core';
import { PrestamosTable } from '../components/prestamo/prestamos-table/prestamos-table'; 
import { PrestamosForm } from '../components/prestamo/prestamos-form/prestamos-form';
import { PrestamosEdit } from '../components/prestamo/prestamos-edit/prestamos-edit';
import { ModalComponent } from '../components/modal/modal';
import { ConfirmModalComponent } from '../components/confirm-modal/confirm-modal';
import { PrestamoService } from '../services/prestamo.service';
import { PrestamoResponse } from '../models/prestamo.model';

@Component({
  selector: 'app-prestamos',
  standalone: true,
  imports: [
    PrestamosTable,
    PrestamosForm,
    PrestamosEdit,
    ModalComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './prestamos.html',
  styleUrl: './prestamos.css',
})
export class Prestamos {
  private readonly prestamoService = inject(PrestamoService);

  /** Referencia a la tabla para recargar */
  tabla = viewChild.required(PrestamosTable);

  // ---------- Modal crear ----------
  modalCrearAbierto = signal(false);

  abrirModalCrear(): void {
    this.modalCrearAbierto.set(true);
  }

  cerrarModalCrear(): void {
    this.modalCrearAbierto.set(false);
  }

  onPrestamoCreado(_p: PrestamoResponse): void {
    this.modalCrearAbierto.set(false);
    this.tabla().recargar();
  }

  // ---------- Modal editar ----------
  modalEditarAbierto = signal(false);
  prestamoSeleccionadoId = signal<number | null>(null);

  onEditarPrestamo(p: PrestamoResponse): void {
    this.prestamoSeleccionadoId.set(p.id);
    this.modalEditarAbierto.set(true);
  }

  cerrarModalEditar(): void {
    this.modalEditarAbierto.set(false);
    this.prestamoSeleccionadoId.set(null);
  }

  onPrestamoActualizado(_p: PrestamoResponse): void {
    this.modalEditarAbierto.set(false);
    this.prestamoSeleccionadoId.set(null);
    this.tabla().recargar();
  }

  // ---------- Modal eliminar ----------
  modalEliminarAbierto = signal(false);
  prestamoAEliminar = signal<PrestamoResponse | null>(null);
  eliminando = signal(false);

  onEliminarPrestamo(p: PrestamoResponse): void {
    this.prestamoAEliminar.set(p);
    this.modalEliminarAbierto.set(true);
  }

  cerrarModalEliminar(): void {
    if (this.eliminando()) return;
    this.modalEliminarAbierto.set(false);
    this.prestamoAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const p = this.prestamoAEliminar();
    if (!p) return;

    this.eliminando.set(true);

    this.prestamoService.eliminarPrestamo(p.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.modalEliminarAbierto.set(false);
        this.prestamoAEliminar.set(null);
        this.tabla().recargar();
      },
      error: (err) => {
        console.error('Error al eliminar préstamo', err);
        this.eliminando.set(false);
      },
    });
  }
}