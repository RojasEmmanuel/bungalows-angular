import { Component, computed, inject, signal, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { PrestamoService } from '../../../services/prestamo.service';
import { EnumsService } from '../../../services/enums.service';
import { PrestamoResponse } from '../../../models/prestamo.model'; 
import { EnumOption } from '../../../models/enum-option.model'; 

type SortColumn =
  | 'nombreColaborador'
  | 'ubicacionColaborador'
  | 'puestoColaborador'
  | 'monto'
  | 'fechaPago'
  | null;

type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-prestamos-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prestamos-table.html',
  styleUrl: './prestamos-table.css',
})
export class PrestamosTable implements OnInit {
  private readonly prestamoService = inject(PrestamoService);
  private readonly enumsService = inject(EnumsService);

  editar = output<PrestamoResponse>();
  eliminar = output<PrestamoResponse>();


  // ---------- Datos crudos ----------
  prestamos = signal<PrestamoResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // ---------- Catálogo de estatus ----------
  estatusList = signal<EnumOption[]>([]);

  // ---------- Filtros ----------
  busqueda = signal('');
  filtroEstatus = signal('');

  // ---------- Ordenamiento ----------
  sortColumn = signal<SortColumn>(null);
  sortDirection = signal<SortDirection>('asc');

  // ---------- Resultado: filtrado + ordenado ----------
  prestamosFiltrados = computed(() => {
    let lista = this.prestamos();

    // Filtro por nombre
    const term = this.busqueda().trim().toLowerCase();
    if (term) {
      lista = lista.filter((p) =>
        p.nombreColaborador?.toLowerCase().includes(term)
      );
    }

    // Filtro por estatus
    if (this.filtroEstatus()) {
      lista = lista.filter((p) => p.estatus === this.filtroEstatus());
    }

    // Ordenamiento
    const col = this.sortColumn();
    if (col) {
      const dir = this.sortDirection() === 'asc' ? 1 : -1;
      lista = [...lista].sort((a, b) => {
        const va = a[col];
        const vb = b[col];

        // Strings
        if (typeof va === 'string' && typeof vb === 'string') {
          return va.localeCompare(vb, 'es', { sensitivity: 'base' }) * dir;
        }

        // Números
        if (typeof va === 'number' && typeof vb === 'number') {
          return (va - vb) * dir;
        }

        // Fechas (string YYYY-MM-DD, comparables lexicográficamente)
        if (col === 'fechaPago') {
          return String(va).localeCompare(String(vb)) * dir;
        }

        return 0;
      });
    }

    return lista;
  });

  // ---------- Computed auxiliares ----------
  hayFiltrosActivos = computed(
    () => !!this.busqueda().trim() || !!this.filtroEstatus()
  );

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarEstatus();
    this.cargarPrestamos();
  }

  // ---------- Cargas ----------
  private cargarEstatus(): void {
    this.enumsService.getEstatusPrestamo().subscribe({
      next: (data) => {
        // El backend devuelve "Pagado", el enum devuelve "PAGADO".
        // Normalizamos el value del catálogo al label que usa el backend.
        const normalizado = data.map((e) => ({
          value: e.label,   // ← usar el label como value
          label: e.label,
        }));
        this.estatusList.set(normalizado);
      },
      error: (err) => console.error('Error al cargar estatus', err),
    });
  }

  private cargarPrestamos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.prestamoService.getPrestamos().subscribe({
      next: (data) => {
        this.prestamos.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar préstamos', err);
        this.error.set('No se pudieron cargar los préstamos.');
        this.loading.set(false);
      },
    });
  }

  // ---------- Handlers de filtros ----------
  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  onFiltroEstatus(event: Event): void {
    this.filtroEstatus.set((event.target as HTMLSelectElement).value);
  }

  onEditar(p: PrestamoResponse): void {
    this.editar.emit(p);
  }

  onEliminar(p: PrestamoResponse): void {
    this.eliminar.emit(p);
  }


  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstatus.set('');
  }

  // ---------- Ordenamiento ----------
  ordenarPor(columna: SortColumn): void {
    if (this.sortColumn() === columna) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(columna);
      this.sortDirection.set('asc');
    }
  }

  iconClass(columna: SortColumn): string {
    if (this.sortColumn() !== columna) return 'sort-icon sort-icon--off';
    return this.sortDirection() === 'asc'
      ? 'sort-icon sort-icon--asc'
      : 'sort-icon sort-icon--desc';
  }

  // ---------- Helpers ----------
  formatoMonto(valor: number | null | undefined): string {
    if (valor == null) return '—';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 2,
    }).format(valor);
  }

  labelEstatus(value: string | null | undefined): string {
    if (!value) return '—';
    const opt = this.estatusList().find((e) => e.value === value);
    return opt?.label ?? value;
  }

  estatusClase(value: string | null | undefined): string {
    const v = (value ?? '').toUpperCase();
    if (v.includes('PAGADO') || v.includes('LIQUIDADO')) return 'badge badge--ok';
    if (v.includes('PENDIENTE') || v.includes('ACTIVO')) return 'badge badge--info';
    if (v.includes('ATRASADO') || v.includes('VENCIDO')) return 'badge badge--warn';
    return 'badge';
  }

  recargar(): void {
    this.cargarPrestamos();
  }
}