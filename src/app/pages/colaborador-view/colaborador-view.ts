import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { ColaboradorService } from '../../services/colaborador.service';
import { ColaboradorResponse } from '../../models/colaborador.model';
import { ColaboradorInfo } from '../../components/colaborador-info/colaborador-info';
import { ColaboradorDocumentos } from '../../components/colaborador-documentos/colaborador-documentos';
import { ColaboradorContactos } from '../../components/colaborador-contacto/colaborador-contacto';
import { DireccionForm } from '../../components/direccion-form/direccion-form';
import { ModalComponent } from '../../components/modal/modal';
import { DireccionResponse } from '../../models/direccion.model';
import { LaboralResponse } from '../../models/laboral.model';
import { LaboralForm } from '../../components/laboral-form/laboral-form';  
import { ConfidencialForm } from '../../components/confidencial-form/confidencial-form';
import { ConfidencialResponse } from '../../models/confidencial.model';
import { ColaboradorDatos } from '../../components/colaborador-datos/colaborador-datos';


@Component({
  selector: 'app-colaborador-view',
  standalone: true,
  imports: [
    CommonModule, 
    ColaboradorInfo, ColaboradorDocumentos, 
    ColaboradorContactos, 
    DireccionForm, ModalComponent,
    LaboralForm, ConfidencialForm, ColaboradorDatos
  ],

  templateUrl: './colaborador-view.html',
  styleUrl: './colaborador-view.css',
})
export class ColaboradorView implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly colaboradorService = inject(ColaboradorService);
  
  modalDireccionAbierto = signal(false);
  modalLaboralAbierto = signal(false); 
  modalConfidencialAbierto = signal(false);
  modalDatosAbierto = signal(false); 

  // ---------- Estado ----------
  colaborador = signal<ColaboradorResponse | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;

    if (isNaN(id)) {
      this.error.set('ID de colaborador inválido.');
      return;
    }

    this.cargarColaborador(id);
  }

  // ---------- HTTP ----------
  private cargarColaborador(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.colaboradorService.getColaboradorById(id).subscribe({
      next: (data) => {
        this.colaborador.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar colaborador', err);
        this.error.set(
          err.status === 404
            ? 'No se encontró el colaborador.'
            : 'No se pudo cargar la información del colaborador.'
        );
        this.loading.set(false);
      },
    });
  }

  abrirModalDireccion() {
    this.modalDireccionAbierto.set(true);
  }

  onDireccionGuardada(_d: DireccionResponse): void {
    this.modalDireccionAbierto.set(false);
    const c = this.colaborador();
    if (c) this.cargarColaborador(c.id);
  }

  abrirModalLaboral(): void {
    this.modalLaboralAbierto.set(true);
  }

  cerrarModalLaboral(): void {
    this.modalLaboralAbierto.set(false);
  }

  onLaboralGuardado(_l: LaboralResponse): void {
    this.modalLaboralAbierto.set(false);
    const c = this.colaborador();
    if (c) this.cargarColaborador(c.id);
  }


  abrirModalConfidencial(): void {
    this.modalConfidencialAbierto.set(true);
  }

  cerrarModalConfidencial(): void {
    this.modalConfidencialAbierto.set(false);
  }

  onConfidencialGuardado(_c: ConfidencialResponse): void {
    this.modalConfidencialAbierto.set(false);
    const c = this.colaborador();
    if (c) this.cargarColaborador(c.id);
  }


  abrirModalDatos(): void {
    this.modalDatosAbierto.set(true);
  }

  cerrarModalDatos(): void {
    this.modalDatosAbierto.set(false);
  }

  onDatosGuardados(_c: ColaboradorResponse): void {
    this.modalDatosAbierto.set(false);
    const c = this.colaborador();
    if (c) this.cargarColaborador(c.id);
  }

  
  // ---------- Handlers ----------
  volver(): void {
    this.router.navigate(['/colaboradores']);
  }
}