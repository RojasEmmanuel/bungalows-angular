import { Component, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacacionesTable } from '../components/vacaciones/vacaciones-table/vacaciones-table';
import { VacacionesForm } from '../components/vacaciones/vacaciones-form/vacaciones-form';
import { ModalComponent } from '../components/modal/modal';

@Component({
  selector: 'app-vacaciones-page',
  standalone: true,
  imports: [CommonModule, VacacionesTable, VacacionesForm, ModalComponent],
  templateUrl: './vacaciones.html',
  styleUrl:'./vacaciones.css'
})
export class Vacaciones {
  tabla = viewChild(VacacionesTable);

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
}