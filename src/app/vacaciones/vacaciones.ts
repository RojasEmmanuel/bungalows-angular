import { Component, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VacacionesTable } from '../components/vacaciones/vacaciones-table/vacaciones-table';
import { VacacionesForm } from '../components/vacaciones/vacaciones-form/vacaciones-form';
import { VacacionesEdit } from '../components/vacaciones/vacaciones-edit/vacaciones-edit';
import { VacacionesPeriodos } from '../components/vacaciones/vacaciones-periodos/vacaciones-periodos';
import { VacacionesCalendario } from '../components/vacaciones/calendario/calendario';
import { ModalComponent } from '../components/modal/modal';
import { ConfirmModalComponent } from '../components/confirm-modal/confirm-modal';

import { VacacionesService } from '../services/vacaciones.service';
import { VacacionesResponse } from '../models/vacaciones.model';

type VistaActiva = 'registros' | 'periodos' | 'calendario';

@Component({
  selector: 'app-vacaciones',
  standalone: true,
  imports: [
    CommonModule,
    VacacionesTable,
    VacacionesForm,
    VacacionesEdit,
    VacacionesPeriodos,
    VacacionesCalendario,
    ModalComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './vacaciones.html',
  styleUrl: './vacaciones.css',
})
export class Vacaciones {
  private readonly vacacionesService = inject(VacacionesService);

  tabla = viewChild(VacacionesTable);

  /** Tab activa */
  vistaActiva = signal<VistaActiva>('registros');

  cambiarVista(vista: VistaActiva): void {
    this.vistaActiva.set(vista);
  }

  // ---------- Modal crear ----------
  modalCrearAbierto = signal(false);

  abrirModal(): void {
    this.modalCrearAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalCrearAbierto.set(false);
  }

  onCreado(): void {
    this.modalCrearAbierto.set(false);
    this.tabla()?.recargar();
  }

  // ---------- Modal editar ----------
  modalEditarAbierto = signal(false);
  vacacionesSeleccionadasId = signal<number | null>(null);

  onEditarVacaciones(v: VacacionesResponse): void {
    this.vacacionesSeleccionadasId.set(v.id);
    this.modalEditarAbierto.set(true);
  }

  cerrarModalEditar(): void {
    this.modalEditarAbierto.set(false);
    this.vacacionesSeleccionadasId.set(null);
  }

  onVacacionesActualizadas(): void {
    this.modalEditarAbierto.set(false);
    this.vacacionesSeleccionadasId.set(null);
    this.tabla()?.recargar();
  }

  // ---------- Modal eliminar ----------
  modalEliminarAbierto = signal(false);
  vacacionesAEliminar = signal<VacacionesResponse | null>(null);
  eliminando = signal(false);

  onEliminarVacaciones(v: VacacionesResponse): void {
    this.vacacionesAEliminar.set(v);
    this.modalEliminarAbierto.set(true);
  }

  cerrarModalEliminar(): void {
    if (this.eliminando()) return;
    this.modalEliminarAbierto.set(false);
    this.vacacionesAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const v = this.vacacionesAEliminar();
    if (!v) return;

    this.eliminando.set(true);

    this.vacacionesService.eliminarVacaciones(v.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.modalEliminarAbierto.set(false);
        this.vacacionesAEliminar.set(null);
        this.tabla()?.recargar();
      },
      error: (err) => {
        console.error('Error al eliminar vacaciones', err);
        this.eliminando.set(false);
      },
    });
  }
}