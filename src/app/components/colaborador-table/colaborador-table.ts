import { Component, computed, input, output, signal } from '@angular/core';
import { ColaboradorTable } from '../../models/colaborador.model';

type SortColumn = 'nombreCompleto' | 'edad' | 'antiguedad' | null;
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-colaborador-table',
  standalone: true,
  templateUrl: './colaborador-table.html',
  styleUrl: './colaborador-table.css',
})
export class ColaboradorTableComponent {
  colaboradores = input.required<ColaboradorTable[]>();
  sortColumn = input<SortColumn>(null);
  sortDirection = input<SortDirection>('asc');

  sortChange = output<SortColumn>();
  verColaborador = output<number>();   // ← NUEVO

  private readonly failedImages = signal<Set<number>>(new Set());

  iniciales = (nombre: string): string => {
    const limpio = nombre?.trim() ?? '';
    if (!limpio) return '?';
    const partes = limpio.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  };

  showAvatar(colaborador: ColaboradorTable): boolean {
    const path = colaborador.fotografia;
    if (!path || path.trim() === '' || path === 'no disponible') return true;
    return this.failedImages().has(colaborador.id);
  }

  onImageError(id: number): void {
    const actual = new Set(this.failedImages());
    actual.add(id);
    this.failedImages.set(actual);
  }

  formatoSueldo(valor: number): string {
    if (valor == null) return '—';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(valor);
  }

  estadoClase(estado: string): string {
    const e = (estado ?? '').toLowerCase();
    if (e === 'activo') return 'badge badge--activo';
    if (e === 'inactivo' || e === 'baja') return 'badge badge--inactivo';
    return 'badge';
  }

  onSort(columna: SortColumn): void {
    this.sortChange.emit(columna);
  }

  iconClass(columna: SortColumn): string {
    if (this.sortColumn() !== columna) return 'sort-icon sort-icon--off';
    return this.sortDirection() === 'asc'
      ? 'sort-icon sort-icon--asc'
      : 'sort-icon sort-icon--desc';
  }

  /** Click en el botón "Ver" */
  onVer(id: number): void {
    this.verColaborador.emit(id);
  }
}