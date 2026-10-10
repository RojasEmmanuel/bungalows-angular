import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { LaboralService } from '../../services/laboral.service';
import { Aniversarios, AntiguedadesProximas } from '../../models/laboral.model';

@Component({
  selector: 'app-aniversarios-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aniversarios-widget.html',
  styleUrl: './aniversarios-widget.css',
})
export class AniversariosWidget implements OnInit {
  private readonly laboralService = inject(LaboralService);
  private readonly router = inject(Router);

  // ---------- Estado ----------
  aniversariosHoy = signal<Aniversarios[]>([]);
  proximos = signal<AntiguedadesProximas[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  /** IDs con imagen fallida */
  private readonly failedImages = signal<Set<number>>(new Set());

  // ---------- Computed ----------
  hayAniversariosHoy = computed(() => this.aniversariosHoy().length > 0);
  totalHoy = computed(() => this.aniversariosHoy().length);
  totalProximos = computed(() => this.proximos().length);

  /**
   * Mensaje dinámico según la cantidad de aniversarios de hoy.
   */
  mensaje = computed(() => {
    const lista = this.aniversariosHoy();
    const n = lista.length;

    if (n === 0) return null;
    if (n === 1) {
      return `${lista[0].nombreColaborador} cumple ${lista[0].antiguedad} ${
        lista[0].antiguedad === 1 ? 'año' : 'años'
      } con nosotros`;
    }
    if (n === 2) {
      return `${lista[0].nombreColaborador} y ${lista[1].nombreColaborador} están cumpliendo años con nosotros`;
    }
    return `${n} personas están cumpliendo años`;
  });

  /**
   * Máximo de avatares a mostrar. Si hay más, se muestra "+N".
   */
  readonly MAX_AVATARES = 4;

  avataresVisibles = computed(() =>
    this.aniversariosHoy().slice(0, this.MAX_AVATARES)
  );

  avataresExtra = computed(() =>
    Math.max(0, this.totalHoy() - this.MAX_AVATARES)
  );

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      hoy: this.laboralService.getAniversarios(),
      proximos: this.laboralService.getAntiguedadesProximas(),
    }).subscribe({
      next: ({ hoy, proximos }) => {
        this.aniversariosHoy.set(hoy);
        this.proximos.set(proximos);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar aniversarios del widget', err);
        this.error.set('No se pudieron cargar los aniversarios.');
        this.loading.set(false);
      },
    });
  }

  // ---------- Navegación ----------
  irAAniversarios(): void {
    this.router.navigate(['/aniversarios']);
  }

  // ---------- Avatar ----------
  iniciales(nombre: string | null | undefined): string {
    const limpio = nombre?.trim() ?? '';
    if (!limpio) return '?';
    const partes = limpio.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  showAvatar(a: Aniversarios): boolean {
    const path = a.fotografia;
    if (!path || path.trim() === '' || path === 'no disponible') return true;
    return this.failedImages().has(a.id);
  }

  onImageError(id: number, event: Event): void {
    event.stopPropagation();   // no queremos que el click del img se propague
    const actual = new Set(this.failedImages());
    actual.add(id);
    this.failedImages.set(actual);
  }
}