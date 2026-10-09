import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AntiguedadesProximas } from '../../models/laboral.model';

/** Grupo de aniversarios según proximidad */
interface Grupo {
  id: 'semana' | 'mes' | 'dos-meses';
  label: string;
  descripcion: string;
  items: AntiguedadesProximas[];
}

@Component({
  selector: 'app-antiguedad-proxima-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './antiguedad-proxima-card.html',
  styleUrl: './antiguedad-proxima-card.css',
})
export class AntiguedadProximaCardComponent {
  /** Lista completa de aniversarios próximos */
  antiguedades = input.required<AntiguedadesProximas[]>();

  // ---------- Búsqueda y filtros ----------
  busqueda = signal('');

  // ---------- Grupos expandidos/contraídos ----------
  /** Por defecto todos expandidos */
  expandidos = signal<Set<Grupo['id']>>(
    new Set(['semana', 'mes', 'dos-meses'])
  );

  // ---------- Avatar fallbacks ----------
  private readonly failedImages = signal<Set<number>>(new Set());

  // ---------- Lista filtrada por búsqueda ----------
  filtradas = computed(() => {
    const term = this.busqueda().trim().toLowerCase();
    if (!term) return this.antiguedades();

    return this.antiguedades().filter(
      (a) =>
        a.nombreColaborador?.toLowerCase().includes(term) ||
        a.puesto?.toLowerCase().includes(term) ||
        a.ubicacion?.toLowerCase().includes(term)
    );
  });

  // ---------- Grupos por proximidad ----------
  grupos = computed<Grupo[]>(() => {
    const lista = this.filtradas();

    const semana = lista.filter((a) => a.diasFaltantes <= 7);
    const mes = lista.filter((a) => a.diasFaltantes > 7 && a.diasFaltantes <= 30);
    const dosMeses = lista.filter(
      (a) => a.diasFaltantes > 30 && a.diasFaltantes <= 60
    );

    return [
      {
        id: 'semana',
        label: 'Próximos 7 días',
        descripcion: 'Aniversarios más inmediatos',
        items: semana,
      },
      {
        id: 'mes',
        label: 'Próximos 30 días',
        descripcion: 'Aniversarios del mes',
        items: mes,
      },
      {
        id: 'dos-meses',
        label: 'De 31 a 60 días',
        descripcion: 'Aniversarios en camino',
        items: dosMeses,
      },
    ];
  });

  // ---------- Resumen ----------
  total = computed(() => this.filtradas().length);
  hayResultados = computed(() => this.total() > 0);

  // ---------- Handlers de búsqueda ----------
  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  // ---------- Handlers de expandir/contraer ----------
  toggleGrupo(id: Grupo['id']): void {
    this.expandidos.update((set) => {
      const nuevo = new Set(set);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else {
        nuevo.add(id);
      }
      return nuevo;
    });
  }

  estaExpandido(id: Grupo['id']): boolean {
    return this.expandidos().has(id);
  }

  expandirTodos(): void {
    this.expandidos.set(new Set(['semana', 'mes', 'dos-meses']));
  }

  contraerTodos(): void {
    this.expandidos.set(new Set());
  }

  // ---------- Avatar ----------
  iniciales(nombre: string | null | undefined): string {
    const limpio = nombre?.trim() ?? '';
    if (!limpio) return '?';
    const partes = limpio.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  showAvatar(a: AntiguedadesProximas): boolean {
    const path = a.fotografia;
    if (!path || path.trim() === '' || path === 'no disponible') return true;
    return this.failedImages().has(a.id);
  }

  onImageError(id: number): void {
    const actual = new Set(this.failedImages());
    actual.add(id);
    this.failedImages.set(actual);
  }

  // ---------- Fechas ----------
  /**
   * Devuelve "12 oct" a partir de fechaIngreso + antiguedadProxima
   * (o calculado desde fechaIngreso).
   */
  fechaProximoAniversario(a: AntiguedadesProximas): string {
    if (!a.fechaIngreso) return '—';
    const [anio, mes, dia] = a.fechaIngreso.split('-').map(Number);
    if (!anio || !mes || !dia) return a.fechaIngreso;

    const meses = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun',
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
    ];
    const mesStr = meses[mes - 1] ?? '';

    const hoy = new Date();
    const anioAniversario =
      a.diasFaltantes === 0 ? hoy.getFullYear() : hoy.getFullYear();
    // Nota: para este componente basta con mostrar día y mes.
    // El año exacto del próximo aniversario depende de si ya pasó o no,
    // pero el grupo ya lo categoriza por días faltantes.

    return `${dia} ${mesStr}`;
  }

  /** Texto "Hoy", "En 3 días", "En 2 semanas" */
  etiquetaProximidad(dias: number): string {
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Mañana';
    if (dias <= 7) return `En ${dias} días`;
    if (dias <= 14) return 'En 1-2 semanas';
    if (dias <= 30) return 'Este mes';
    if (dias <= 45) return 'En 1-2 meses';
    return 'En ~2 meses';
  }

  /** Clase para urgencia */
  badgeClase(dias: number): string {
    if (dias === 0) return 'badge badge--hoy';
    if (dias <= 7) return 'badge badge--proximo';
    return 'badge';
  }
}