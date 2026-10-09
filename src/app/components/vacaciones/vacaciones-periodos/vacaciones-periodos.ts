import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { VacacionalService } from '../../../services/vacacional.service';
import { VacacionalResponse } from '../../../models/vacaciones.model';

@Component({
  selector: 'app-vacaciones-periodos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vacaciones-periodos.html',
  styleUrl: './vacaciones-periodos.css',
})
export class VacacionesPeriodos implements OnInit {
  private readonly vacacionalService = inject(VacacionalService);

  // ---------- Datos crudos ----------
  periodos = signal<VacacionalResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // ---------- Filtro ----------
  busqueda = signal('');

  // ---------- Resultado filtrado ----------
  periodosFiltrados = computed(() => {
    const term = this.busqueda().trim().toLowerCase();
    if (!term) return this.periodos();

    return this.periodos().filter((p) =>
      p.colaboradorNombre?.toLowerCase().includes(term)
    );
  });

  // ---------- Auxiliares ----------
  hayBusqueda = computed(() => !!this.busqueda().trim());

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarPeriodos();
  }

  private cargarPeriodos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.vacacionalService.getVacaciones().subscribe({
      next: (data) => {
        this.periodos.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar periodos vacacionales', err);
        this.error.set('No se pudieron cargar los periodos vacacionales.');
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

  // ---------- Helpers ----------
  iniciales(nombre: string | null | undefined): string {
    const limpio = nombre?.trim() ?? '';
    if (!limpio) return '?';
    const partes = limpio.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  /** Porcentaje de días usados sobre el total */
  porcentajeUsado(p: VacacionalResponse): number {
    if (!p.diasVacaciones || p.diasVacaciones === 0) return 0;
    const usados = p.diasOcupados ?? 0;
    return Math.min(100, Math.round((usados / p.diasVacaciones) * 100));
  }

  /** Color de la barra de progreso según el uso */
  progresoClase(p: VacacionalResponse): string {
    const pct = this.porcentajeUsado(p);
    if (pct >= 100) return 'progreso__fill progreso__fill--danger';
    if (pct >= 75) return 'progreso__fill progreso__fill--warn';
    return 'progreso__fill progreso__fill--ok';
  }
}