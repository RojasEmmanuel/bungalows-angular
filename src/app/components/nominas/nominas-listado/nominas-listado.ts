// nominas-listado/nominas-listado.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { NominaService } from '../../../services/nomina.service'; 
import {
  NominaFiltros,
  NominaListadoResponse,
  NominaResumenResponse,
  Page,
} from '../../../models/nomina.model';
import { Quincena, rangoQuincena, etiquetaQuincena } from '../../../utils/quincenas';

import { NominaResumenCards } from '../nomina-resumen-cards/nomina-resumen-cards';
import { NominaFiltrosComponent } from '../nomina-filtros/nomina-filtros';
import { NominaItemComponent } from '../nomina-item/nomina-item';
import { NominaPaginadorComponent } from '../nomina-paginador/nomina-paginador';
import { NominaDetalleComponent } from '../nomina-detalle/nomina-detalle';
import { ModalComponent } from '../../modal/modal';
import { EmptyStateComponent } from '../../empty-state/empty-state';

@Component({
  selector: 'app-nominas-listado',
  standalone: true,
  imports: [
    CommonModule,
    NominaResumenCards,
    NominaFiltrosComponent,
    NominaItemComponent,
    NominaPaginadorComponent,
    NominaDetalleComponent,
    ModalComponent,
    EmptyStateComponent
  ],
  templateUrl: './nominas-listado.html',
})
export class NominasListado implements OnInit {
  private nominaService = inject(NominaService);
  private router = inject(Router);

  // ── Estado
  ejercicios = signal<number[]>([]);
  ejercicioSeleccionado = signal<number>(new Date().getFullYear());
  quincenaActiva = signal<Quincena | null>(null);

  filtros = signal<NominaFiltros>({});
  page = signal<Page<NominaListadoResponse> | null>(null);
  resumen = signal<NominaResumenResponse>({
    cantidadNominas: 0,
    subtotal: 0,
    descuentos: 0,
    retenciones: 0,
    total: 0,
  });

  cargandoListado = signal(false);
  cargandoResumen = signal(false);

 

  // ── Derivados
  etiquetaPeriodoActual = computed(() => {
    const q = this.quincenaActiva();
    const e = this.ejercicioSeleccionado();
    if (q) return etiquetaQuincena(q, e);
    const f = this.filtros();
    if (f.fechaInicio && f.fechaFin) {
      return `${this.formatoFecha(f.fechaInicio)} – ${this.formatoFecha(f.fechaFin)}`;
    }
    return `Ejercicio ${e}`;
  });

  ngOnInit(): void {
    this.cargarEjercicios();
  }

  // ── Carga inicial
  private cargarEjercicios(): void {
    this.nominaService.getEjercicios().subscribe({
      next: (ejercicios) => {
        this.ejercicios.set(ejercicios);
        const actual = ejercicios[0] ?? new Date().getFullYear();
        this.ejercicioSeleccionado.set(actual);
        this.seleccionarQuincena('primera');
      },
      error: () => {
        // Si falla, al menos intentamos con el año actual
        this.ejercicios.set([new Date().getFullYear()]);
        this.seleccionarQuincena('primera');
      },
    });
  }

  // ── Acciones
  onEjercicioChange(ejercicio: number): void {
    this.ejercicioSeleccionado.set(ejercicio);
    if (this.quincenaActiva()) {
      this.seleccionarQuincena(this.quincenaActiva()!);
    } else {
      this.recargar(0);
    }
  }

  seleccionarQuincena(q: Quincena): void {
    const ejercicio = this.ejercicioSeleccionado();
    const rango = rangoQuincena(ejercicio, q);

    this.quincenaActiva.set(q);
    this.filtros.set({
      ejercicio,
      fechaInicio: rango.fechaInicio,
      fechaFin: rango.fechaFin,
    });
    this.recargar(0);
  }

  aplicarFiltros(f: NominaFiltros): void {
    this.quincenaActiva.set(null); // ya no es un acceso rápido
    this.filtros.set({
      ...f,
      ejercicio: this.ejercicioSeleccionado(),
    });
    this.recargar(0);
  }

  limpiarFiltros(): void {
    this.filtros.set({ ejercicio: this.ejercicioSeleccionado() });
    this.quincenaActiva.set(null);
    this.recargar(0);
  }

  cambiarPagina(p: number): void {
    this.recargar(p);
  }

 

  // ── Carga de datos
  private recargar(page: number): void {
    const filtrosBackend = this.construirFiltrosBackend(this.filtros());

    this.cargandoListado.set(true);
    this.nominaService
      .getListado(filtrosBackend, page, 20, 'fechaPago,desc')
      .pipe(finalize(() => this.cargandoListado.set(false)))
      .subscribe({ next: (p) => this.page.set(p) });

    this.cargandoResumen.set(true);
    this.nominaService
      .getResumen(filtrosBackend)   // ← sin ejercicio si ya hay fechas
      .pipe(finalize(() => this.cargandoResumen.set(false)))
      .subscribe({ next: (r) => this.resumen.set(r) });
  }

  private formatoFecha(iso: string): string {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  private construirFiltrosBackend(
    filtros: NominaFiltros
  ): NominaFiltros {
    // Si hay fechas, manda solo fechas
    if (filtros.fechaInicio && filtros.fechaFin) {
      return {
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
        colaborador: filtros.colaborador,
      };
    }
    // Si no, manda solo ejercicio
    return {
      ejercicio: filtros.ejercicio,
      colaborador: filtros.colaborador,
    };
  }



  modalAbierto = signal(false)
  nominaSeleccionadaId = signal<number | null>(null);

  abrirDetalle(id:number):void{
    this.nominaSeleccionadaId.set(id);
    this.modalAbierto.set(true);
  }

  cerrarDetalle():void{
    this.modalAbierto.set(false);
    this.nominaSeleccionadaId.set(null);
  }
}