import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { LaboralService } from '../../services/laboral.service';
import { Aniversarios as AniversarioModel } from '../../models/laboral.model';

@Component({
  selector: 'app-aniversarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aniversarios.html',
  styleUrl: './aniversarios.css',
})
export class Aniversarios implements OnInit {
  private readonly laboralService = inject(LaboralService);

  // ---------- Estado ----------
  aniversarios = signal<AniversarioModel[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  /** IDs con imagen fallida (para fallback a iniciales) */
  private readonly failedImages = signal<Set<number>>(new Set());

  // ---------- Computed ----------
  hayAniversarios = computed(() => this.aniversarios().length > 0);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarAniversarios();
  }

  // ---------- Carga ----------
  private cargarAniversarios(): void {
    this.loading.set(true);
    this.error.set(null);

    this.laboralService.getAniversarios().subscribe({
      next: (data) => {
        this.aniversarios.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar aniversarios', err);
        this.error.set('No se pudieron cargar los aniversarios.');
        this.loading.set(false);
      },
    });
  }

  // ---------- Helpers ----------
  /** Iniciales del nombre: "Emmanuel Rojas" → "ER" */
  iniciales(nombre: string): string {
    const limpio = nombre?.trim() ?? '';
    if (!limpio) return '?';
    const partes = limpio.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  /** ¿Debemos mostrar el avatar de iniciales? */
  showAvatar(a: AniversarioModel): boolean {
    const path = a.fotografia;
    if (!path || path.trim() === '' || path === 'no disponible') return true;
    return this.failedImages().has(a.id);
  }

  onImageError(id: number): void {
    const actual = new Set(this.failedImages());
    actual.add(id);
    this.failedImages.set(actual);
  }

  /** Formato de fecha de ingreso: "2021-03-12" → "12 mar 2021" */
  formatoFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const [anio, mes, dia] = fecha.split('-').map(Number);
    if (!anio || !mes || !dia) return fecha;
    const meses = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun',
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
    ];
    return `${dia} ${meses[mes - 1]} ${anio}`;
  }
}