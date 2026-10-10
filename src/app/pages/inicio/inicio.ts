import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UbicacionService } from '../../services/ubicacion.service';
import { UbicacionDetail, UbicacionResponse } from '../../models/ubicacion.model';
import { PuestoResponse } from '../../models/puesto.model';
import { UbicacionCardComponent } from '../../components/ubicacion-card/ubicacion-card';
import { UbicacionFormComponent } from '../../components/ubicacion-form/ubicacion-form';
import { PuestoForm } from '../../components/puesto-form/puesto-form';
import { ModalComponent } from '../../components/modal/modal';
import { UbicacionPatch } from '../../components/ubicacion-patch/ubicacion-patch';
import { AniversariosWidget } from '../../components/aniversarios-widget/aniversarios-widget';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    UbicacionCardComponent,
    UbicacionFormComponent,
    PuestoForm,
    ModalComponent,
    UbicacionPatch,
    AniversariosWidget,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class InicioComponent implements OnInit {
  private readonly ubicacionService = inject(UbicacionService);

  ubicaciones = signal<UbicacionDetail[]>([]);
  loadingUbicaciones = signal(false);

  // ---------- Modales ----------
  modalUbicacionAbierto = signal(false);
  modalPuestoAbierto = signal(false);
  modalUbicacionPatchAbierto = signal(false);
  ubicacionSeleccionadaId = signal<number | null>(null);

  ngOnInit(): void {
    this.cargarUbicaciones();
  }

  // ---------- Modal ubicación ----------
  abrirModalUbicacion(): void {
    this.modalUbicacionAbierto.set(true);
  }

  cerrarModalUbicacion(): void {
    this.modalUbicacionAbierto.set(false);
  }

  onUbicacionCreada(u: UbicacionResponse): void {
    this.modalUbicacionAbierto.set(false);
    this.cargarUbicaciones();
  }

  // ---------- Modal puesto ----------
  abrirModalPuesto(): void {
    this.modalPuestoAbierto.set(true);
  }

  cerrarModalPuesto(): void {
    this.modalPuestoAbierto.set(false);
  }

  onPuestoCreado(p: PuestoResponse): void {
    this.modalPuestoAbierto.set(false);
    console.log('Puesto creado:', p);
  }

  // ---------- Cargas ----------
  private cargarUbicaciones(): void {
    this.loadingUbicaciones.set(true);
    this.ubicacionService.getUbicacionesDetail().subscribe({
      next: (data) => {
        this.ubicaciones.set(data);
        this.loadingUbicaciones.set(false);
      },
      error: (err) => {
        console.error('Error ubicaciones', err);
        this.loadingUbicaciones.set(false);
      },
    });
  }

  // ---------- Modal editar ubicación ----------
  abrirModalEditarUbicacion(u: UbicacionDetail): void {
    this.ubicacionSeleccionadaId.set(u.id);
    this.modalUbicacionPatchAbierto.set(true);
  }

  cerrarModalEditarUbicacion(): void {
    this.modalUbicacionPatchAbierto.set(false);
    this.ubicacionSeleccionadaId.set(null);
  }

  onUbicacionActualizada(_u: UbicacionResponse): void {
    this.modalUbicacionPatchAbierto.set(false);
    this.ubicacionSeleccionadaId.set(null);
    this.cargarUbicaciones();
  }
}