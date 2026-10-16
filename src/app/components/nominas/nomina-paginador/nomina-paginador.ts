// nomina-paginador/nomina-paginador.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nomina-paginador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nomina-paginador.html',
})
export class NominaPaginadorComponent {
  @Input() page = 0;
  @Input() totalPages = 0;
  @Input() totalElements = 0;
  @Input() size = 20;

  @Output() pageChange = new EventEmitter<number>();

  get desde(): number { return this.totalElements === 0 ? 0 : this.page * this.size + 1; }
  get hasta(): number { return Math.min((this.page + 1) * this.size, this.totalElements); }
  get puedeAnterior(): boolean { return this.page > 0; }
  get puedeSiguiente(): boolean { return this.page < this.totalPages - 1; }

  /** Rango compacto de páginas visibles (máx. 5) */
  get paginas(): (number | '…')[] {
    const total = this.totalPages;
    const actual = this.page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);

    const paginas: (number | '…')[] = [0];
    const inicio = Math.max(1, actual - 1);
    const fin = Math.min(total - 2, actual + 1);

    if (inicio > 1) paginas.push('…');
    for (let i = inicio; i <= fin; i++) paginas.push(i);
    if (fin < total - 2) paginas.push('…');
    paginas.push(total - 1);

    return paginas;
  }

  ir(p: number | '…'): void {
  if (typeof p === 'number' && p !== this.page) {
      this.pageChange.emit(p);
    }
  }
}