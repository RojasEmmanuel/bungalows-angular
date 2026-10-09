import { Component, computed, effect, input, output, signal } from '@angular/core';
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
  /** Datos crudos: el padre NO filtra, NO ordena, NO pagina. */
  colaboradores = input.required<ColaboradorTable[]>();

  verColaborador = output<number>();

  // ---------- Filtros ----------
  busqueda = signal('');
  filtroPuesto = signal('');
  filtroUbicacion = signal('');
  filtroTurno = signal('');
  filtroDiaDescanso = signal('');

  // ---------- Ordenamiento ----------
  sortColumn = signal<SortColumn>(null);
  sortDirection = signal<SortDirection>('asc');

  // ---------- Paginación ----------
  readonly pageSize = signal(15);
  readonly currentPage = signal(1);
  readonly mostrarTodos = signal(false);

  /** Tamaño de página efectivo: si mostrarTodos, es "infinito". */
  private readonly pageSizeEfectivo = computed(() =>
    this.mostrarTodos() ? Number.MAX_SAFE_INTEGER : this.pageSize()
  );

  // ---------- Imágenes fallidas ----------
  private readonly failedImages = signal<Set<number>>(new Set());

  // ---------- Opciones únicas para los selects ----------
  opcionesPuesto = computed(() =>
    this.uniqueSorted(this.colaboradores().map((c) => c.puesto))
  );
  opcionesUbicacion = computed(() =>
    this.uniqueSorted(this.colaboradores().map((c) => c.ubicacion))
  );
  opcionesTurno = computed(() =>
    this.uniqueSorted(this.colaboradores().map((c) => c.turno))
  );
  opcionesDiaDescanso = computed(() =>
    this.uniqueSorted(this.colaboradores().map((c) => c.diaDescanso))
  );

  // ---------- Filtrado + ordenado ----------
  readonly colaboradoresFiltrados = computed(() => {
    let lista = this.colaboradores();

    const term = this.busqueda().trim().toLowerCase();
    if (term) {
      lista = lista.filter((c) =>
        c.nombreCompleto?.toLowerCase().includes(term)
      );
    }
    if (this.filtroPuesto()) {
      lista = lista.filter((c) => c.puesto === this.filtroPuesto());
    }
    if (this.filtroUbicacion()) {
      lista = lista.filter((c) => c.ubicacion === this.filtroUbicacion());
    }
    if (this.filtroTurno()) {
      lista = lista.filter((c) => c.turno === this.filtroTurno());
    }
    if (this.filtroDiaDescanso()) {
      lista = lista.filter((c) => c.diaDescanso === this.filtroDiaDescanso());
    }

    const col = this.sortColumn();
    if (col) {
      const dir = this.sortDirection() === 'asc' ? 1 : -1;
      lista = [...lista].sort((a, b) => {
        const va = a[col];
        const vb = b[col];
        if (typeof va === 'string' && typeof vb === 'string') {
          return va.localeCompare(vb, 'es', { sensitivity: 'base' }) * dir;
        }
        return ((va as number) - (vb as number)) * dir;
      });
    }

    return lista;
  });

  // ---------- Paginación derivada ----------
  readonly totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(this.colaboradoresFiltrados().length / this.pageSizeEfectivo())
    )
  );

  readonly pageRows = computed(() => {
    const size = this.pageSizeEfectivo();
    const start = (this.currentPage() - 1) * size;
    return this.colaboradoresFiltrados().slice(start, start + size);
  });

  readonly rangeStart = computed(() =>
    this.colaboradoresFiltrados().length === 0
      ? 0
      : (this.currentPage() - 1) * this.pageSizeEfectivo() + 1
  );

  readonly rangeEnd = computed(() =>
    Math.min(
      this.currentPage() * this.pageSizeEfectivo(),
      this.colaboradoresFiltrados().length
    )
  );

  /** El paginador normal se oculta cuando "ver todos" está activo. */
  readonly mostrarPaginador = computed(() => !this.mostrarTodos());

  // ---------- ¿Hay filtros activos? ----------
  readonly hayFiltrosActivos = computed(
    () =>
      !!this.busqueda().trim() ||
      !!this.filtroPuesto() ||
      !!this.filtroUbicacion() ||
      !!this.filtroTurno() ||
      !!this.filtroDiaDescanso()
  );

  constructor() {
    // Resetear la página cuando cambian filtros, orden, datos o modo "ver todos"
    effect(() => {
      this.busqueda();
      this.filtroPuesto();
      this.filtroUbicacion();
      this.filtroTurno();
      this.filtroDiaDescanso();
      this.sortColumn();
      this.sortDirection();
      this.colaboradores();
      this.mostrarTodos();
      this.currentPage.set(1);
    });
  }

  // ---------- Handlers de filtros ----------
  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }
  onFiltroPuesto(event: Event): void {
    this.filtroPuesto.set((event.target as HTMLSelectElement).value);
  }
  onFiltroUbicacion(event: Event): void {
    this.filtroUbicacion.set((event.target as HTMLSelectElement).value);
  }
  onFiltroTurno(event: Event): void {
    this.filtroTurno.set((event.target as HTMLSelectElement).value);
  }
  onFiltroDiaDescanso(event: Event): void {
    this.filtroDiaDescanso.set((event.target as HTMLSelectElement).value);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroPuesto.set('');
    this.filtroUbicacion.set('');
    this.filtroTurno.set('');
    this.filtroDiaDescanso.set('');
  }

  // ---------- Ordenamiento ----------
  onSort(columna: SortColumn): void {
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

  // ---------- Paginación ----------
  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.currentPage.set(p);
  }
  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }
  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  toggleMostrarTodos(): void {
    this.mostrarTodos.update((v) => !v);
    this.currentPage.set(1);
  }

  // ---------- Helpers de presentación ----------
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

  onVer(id: number): void {
    this.verColaborador.emit(id);
  }

  private uniqueSorted(values: (string | null | undefined)[]): string[] {
    const set = new Set<string>();
    for (const v of values) {
      if (v && v.trim() !== '') set.add(v);
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }
}