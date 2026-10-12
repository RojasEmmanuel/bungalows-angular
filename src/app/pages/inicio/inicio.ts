import { Component, inject, signal, OnInit, viewChild } from '@angular/core';
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
import { EmpresaList } from '../../components/empresa/empresa-list/empresa-list';
import { EmpresaForm } from '../../components/empresa/empresa-form/empresa-form';
import { EmpresaEdit } from '../../components/empresa/empresa-edit/empresa-edit';
import { empresaResponse } from '../../models/empresa.model';

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
    EmpresaList,
    EmpresaForm,
    EmpresaEdit,
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

  // Empresa: crear
  modalEmpresaAbierto = signal(false);
  empresaListRef = viewChild(EmpresaList);

  // Empresa: editar
  modalEmpresaEditAbierto = signal(false);
  empresaEditId = signal<number | null>(null);

  ngOnInit(): void {
    this.cargarUbicaciones();
  }

  // ---------- Modal ubicación ----------
  abrirModalUbicacion(): void { this.modalUbicacionAbierto.set(true); }
  cerrarModalUbicacion(): void { this.modalUbicacionAbierto.set(false); }
  onUbicacionCreada(u: UbicacionResponse): void {
    this.modalUbicacionAbierto.set(false);
    this.cargarUbicaciones();
  }

  // ---------- Modal puesto ----------
  abrirModalPuesto(): void { this.modalPuestoAbierto.set(true); }
  cerrarModalPuesto(): void { this.modalPuestoAbierto.set(false); }
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

  // ---------- Empresa: crear ----------
  abrirModalEmpresa(): void { this.modalEmpresaAbierto.set(true); }
  cerrarModalEmpresa(): void { this.modalEmpresaAbierto.set(false); }
  onEmpresaCreada(): void {
    this.modalEmpresaAbierto.set(false);
    this.empresaListRef()?.recargar();
  }

  // ---------- Empresa: editar ----------
  onEmpresaEditar(id: number): void {
    this.empresaEditId.set(id);
    this.modalEmpresaEditAbierto.set(true);
  }

  cerrarModalEmpresaEdit(): void {
    this.modalEmpresaEditAbierto.set(false);
    this.empresaEditId.set(null);
  }

  onEmpresaActualizada(): void {
    this.modalEmpresaEditAbierto.set(false);
    this.empresaEditId.set(null);
    this.empresaListRef()?.recargar();
  }
}