import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LaboralService } from '../../services/laboral.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { AntiguedadesProximas } from '../../models/laboral.model';
import { UbicacionDetail, UbicacionResponse } from '../../models/ubicacion.model';
import { PuestoResponse } from '../../models/puesto.model';
import { UbicacionCardComponent } from '../../components/ubicacion-card/ubicacion-card';
import { AntiguedadProximaCardComponent } from '../../components/antiguedad-proxima-card/antiguedad-proxima-card';
import { UbicacionFormComponent } from '../../components/ubicacion-form/ubicacion-form';
import { PuestoForm } from '../../components/puesto-form/puesto-form';
import { ModalComponent } from '../../components/modal/modal';
import { UbicacionPatch } from '../../components/ubicacion-patch/ubicacion-patch';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    CommonModule,
    UbicacionCardComponent,
    AntiguedadProximaCardComponent,
    UbicacionFormComponent,
    PuestoForm,          // ← agregar
    ModalComponent,
    UbicacionPatch
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class InicioComponent implements OnInit {
  private readonly ubicacionService = inject(UbicacionService);
  private readonly laboralService = inject(LaboralService);

  ubicaciones = signal<UbicacionDetail[]>([]);
  antiguedades = signal<AntiguedadesProximas[]>([]);

  loadingUbicaciones = signal(false);
  loadingAntiguedades = signal(false);

  // ---------- Modales ----------
  modalUbicacionAbierto = signal(false);
  modalPuestoAbierto = signal(false);      
  modalUbicacionPatchAbierto = signal(false);
  ubicacionSeleccionadaId = signal<number | null>(null);  

  ngOnInit(): void {
    this.cargarUbicaciones();
    this.cargarAntiguedades();
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
    // Si tuvieras una lista de puestos aquí, la recargarías.
    // Por ahora no hay lista de puestos en esta página.
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

  private cargarAntiguedades(): void {
    this.loadingAntiguedades.set(true);
    this.laboralService.getAntiguedadesProximas().subscribe({
      next: (data) => {
        this.antiguedades.set(data);
        this.loadingAntiguedades.set(false);
      },
      error: (err) => {
        console.error('Error antigüedades', err);
        this.loadingAntiguedades.set(false);
      },
    });
  }


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
    this.cargarUbicaciones();   // recarga la lista para reflejar los cambios
  }


}