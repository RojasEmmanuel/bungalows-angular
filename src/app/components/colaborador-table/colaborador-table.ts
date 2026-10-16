import { Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColaboradorTable } from '../../models/colaborador.model';
import { EmptyStateComponent } from '../../components/empty-state/empty-state';

type SortColumn = 'nombreCompleto' | 'edad' | 'antiguedad' | null;
type SortDirection = 'asc' | 'desc';

const TODAS = '__todas__';

interface TabState {
  busqueda: string;
  filtroPuesto: string;
  filtroTurno: string;
  filtroDiaDescanso: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  currentPage: number;
  mostrarTodos: boolean;
}

const createInitialTabState = (): TabState => ({
  busqueda: '',
  filtroPuesto: '',
  filtroTurno: '',
  filtroDiaDescanso: '',
  sortColumn: null,
  sortDirection: 'asc',
  currentPage: 1,
  mostrarTodos: false,
});

@Component({
  selector: 'app-colaborador-table',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './colaborador-table.html',
  styleUrl: './colaborador-table.css',
})
export class ColaboradorTableComponent {
  colaboradores = input.required<ColaboradorTable[]>();
  verColaborador = output<number>();

  readonly pageSize = signal(15);

  // ---------- Tabs por ubicación ----------
  /** Ubicaciones únicas ordenadas alfabéticamente. */
  readonly ubicaciones = computed(() =>
    this.uniqueSorted(this.colaboradores().map((c) => c.ubicacion))
  );

  /** Lista de tabs: "Todas" + cada ubicación. */
  readonly tabs = computed(() => [TODAS, ...this.ubicaciones()]);

  /** Tab activo. */
  readonly tabActivo = signal<string>(TODAS);

  /** Estado por tab (filtros, orden, paginación). */
  private readonly tabStates = signal<Map<string, TabState>>(new Map());

  /** Estado del tab activo (con fallback a inicial). */
  readonly estadoActual = computed<TabState>(() => {
    const map = this.tabStates();
    return map.get(this.tabActivo()) ?? createInitialTabState();
  });

  // Helpers para leer/escribir el estado del tab activo
  private patchEstado(patch: Partial<TabState>): void {
    const key = this.tabActivo();
    const map = new Map(this.tabStates());
    const actual = map.get(key) ?? createInitialTabState();
    map.set(key, { ...actual, ...patch });
    this.tabStates.set(map);
  }

  // Signals puente (para que el template siga usando `busqueda()` etc.)
  readonly busqueda = computed(() => this.estadoActual().busqueda);
  readonly filtroPuesto = computed(() => this.estadoActual().filtroPuesto);
  readonly filtroTurno = computed(() => this.estadoActual().filtroTurno);
  readonly filtroDiaDescanso = computed(() => this.estadoActual().filtroDiaDescanso);
  readonly sortColumn = computed(() => this.estadoActual().sortColumn);
  readonly sortDirection = computed(() => this.estadoActual().sortDirection);
  readonly currentPage = computed(() => this.estadoActual().currentPage);
  readonly mostrarTodos = computed(() => this.estadoActual().mostrarTodos);

  // ---------- Imágenes fallidas (global, no por tab) ----------
  private readonly failedImages = signal<Set<number>>(new Set());

  // ---------- Opciones únicas para los selects ----------
  opcionesPuesto = computed(() =>
    this.uniqueSorted(this.colaboradores().map((c) => c.puesto))
  );
  opcionesTurno = computed(() =>
    this.uniqueSorted(this.colaboradores().map((c) => c.turno))
  );
  opcionesDiaDescanso = computed(() =>
    this.uniqueSorted(this.colaboradores().map((c) => c.diaDescanso))
  );

  // ---------- Datos base del tab activo ----------
  readonly colaboradoresDelTab = computed(() => {
    const tab = this.tabActivo();
    if (tab === TODAS) return this.colaboradores();
    return this.colaboradores().filter((c) => c.ubicacion === tab);
  });

  // ---------- Filtrado + ordenado ----------
  readonly colaboradoresFiltrados = computed(() => {
    let lista = this.colaboradoresDelTab();
    const estado = this.estadoActual();

    const term = estado.busqueda.trim().toLowerCase();
    if (term) {
      lista = lista.filter((c) =>
        c.nombreCompleto?.toLowerCase().includes(term)
      );
    }
    if (estado.filtroPuesto) {
      lista = lista.filter((c) => c.puesto === estado.filtroPuesto);
    }
    if (estado.filtroTurno) {
      lista = lista.filter((c) => c.turno === estado.filtroTurno);
    }
    if (estado.filtroDiaDescanso) {
      lista = lista.filter((c) => c.diaDescanso === estado.filtroDiaDescanso);
    }

    if (estado.sortColumn) {
      const dir = estado.sortDirection === 'asc' ? 1 : -1;
      const col = estado.sortColumn;
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
  private readonly pageSizeEfectivo = computed(() =>
    this.estadoActual().mostrarTodos ? Number.MAX_SAFE_INTEGER : this.pageSize()
  );

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

  readonly mostrarPaginador = computed(() => !this.estadoActual().mostrarTodos);

  // ---------- ¿Hay filtros activos? ----------
  readonly hayFiltrosActivos = computed(() => {
    const e = this.estadoActual();
    return (
      !!e.busqueda.trim() ||
      !!e.filtroPuesto ||
      !!e.filtroTurno ||
      !!e.filtroDiaDescanso
    );
  });

  readonly hayColaboradores = computed(() => this.colaboradoresDelTab().length > 0);

  /** Total de colaboradores globales (para saber si mostrar tabs). */
  readonly hayColaboradoresGlobal = computed(() => this.colaboradores().length > 0);

  constructor() {
    // Si el tab activo deja de existir (cambian datos), volver a "Todas".
    effect(() => {
      const tabs = this.tabs();
      if (!tabs.includes(this.tabActivo())) {
        this.tabActivo.set(TODAS);
      }
    });
  }

  // ---------- Tabs ----------
  seleccionarTab(ubicacion: string): void {
    if (this.tabActivo() === ubicacion) return;
    this.tabActivo.set(ubicacion);
  }

  tabLabel(ubicacion: string): string {
    return ubicacion === TODAS ? 'Todas' : ubicacion;
  }

  // ---------- Handlers de filtros ----------
  onBusqueda(event: Event): void {
    this.patchEstado({ busqueda: (event.target as HTMLInputElement).value, currentPage: 1 });
  }
  onFiltroPuesto(event: Event): void {
    this.patchEstado({ filtroPuesto: (event.target as HTMLSelectElement).value, currentPage: 1 });
  }
  onFiltroTurno(event: Event): void {
    this.patchEstado({ filtroTurno: (event.target as HTMLSelectElement).value, currentPage: 1 });
  }
  onFiltroDiaDescanso(event: Event): void {
    this.patchEstado({ filtroDiaDescanso: (event.target as HTMLSelectElement).value, currentPage: 1 });
  }

  limpiarFiltros(): void {
    this.patchEstado({
      busqueda: '',
      filtroPuesto: '',
      filtroTurno: '',
      filtroDiaDescanso: '',
      currentPage: 1,
    });
  }

  // ---------- Ordenamiento ----------
  onSort(columna: SortColumn): void {
    const e = this.estadoActual();
    if (e.sortColumn === columna) {
      this.patchEstado({ sortDirection: e.sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      this.patchEstado({ sortColumn: columna, sortDirection: 'asc' });
    }
  }

  iconClass(columna: SortColumn): string {
    const e = this.estadoActual();
    if (e.sortColumn !== columna) return 'sort-icon sort-icon--off';
    return e.sortDirection === 'asc'
      ? 'sort-icon sort-icon--asc'
      : 'sort-icon sort-icon--desc';
  }

  // ---------- Paginación ----------
  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.patchEstado({ currentPage: p });
  }
  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }
  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  toggleMostrarTodos(): void {
    this.patchEstado({ mostrarTodos: !this.estadoActual().mostrarTodos, currentPage: 1 });
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