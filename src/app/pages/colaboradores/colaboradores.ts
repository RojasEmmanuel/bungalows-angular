import { Component, computed, inject, signal, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { ColaboradorService } from '../../services/colaborador.service';
import { ColaboradorTableComponent } from '../../components/colaborador-table/colaborador-table';
import { ColaboradorForm } from '../../components/colaborador-form/colaborador-form';
import { ModalComponent } from '../../components/modal/modal';
import { ColaboradorTable } from '../../models/colaborador.model';

type SortColumn = 'nombreCompleto' | 'edad' | 'antiguedad' | null;
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [
    CommonModule,
    ColaboradorTableComponent,
    RouterLink,
  ],
  templateUrl: './colaboradores.html',
  styleUrl: './colaboradores.css',
})
export class ColaboradoresComponent implements OnInit {
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly router = inject(Router);

  /** Referencia al componente tabla (si lo necesitas para recargar) */
  tabla = viewChild(ColaboradorTableComponent);

  // ---------- Datos crudos ----------
  colaboradores = signal<ColaboradorTable[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // ---------- Filtros ----------
  busqueda = signal('');
  filtroPuesto = signal('');
  filtroUbicacion = signal('');
  filtroTurno = signal('');
  filtroDiaDescanso = signal('');

  // ---------- Ordenamiento ----------
  sortColumn = signal<SortColumn>(null);
  sortDirection = signal<SortDirection>('asc');

  // ---------- Modal crear ----------
  modalCrearAbierto = signal(false);

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

  // ---------- Resultado: filtrado + ordenado ----------
  colaboradoresFiltrados = computed(() => {
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
      lista = lista.filter(
        (c) => c.diaDescanso === this.filtroDiaDescanso()
      );
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

  /** ¿Hay algún filtro activo? */
  hayFiltrosActivos = computed(
    () =>
      !!this.busqueda().trim() ||
      !!this.filtroPuesto() ||
      !!this.filtroUbicacion() ||
      !!this.filtroTurno() ||
      !!this.filtroDiaDescanso()
  );

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarColaboradores();
  }

  // ---------- Modal crear ----------
  abrirModal(): void {
    this.modalCrearAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalCrearAbierto.set(false);
  }

  /**
   * Cuando el form emite `creado`, redirige al detalle del colaborador.
   * El `ColaboradorTable` que devuelve el backend incluye el `id`.
   */
  onColaboradorCreado(colaborador: ColaboradorTable): void {
    this.modalCrearAbierto.set(false);
    this.router.navigate(['/colaboradores', colaborador.id]);
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
  ordenarPor(columna: SortColumn): void {
    if (this.sortColumn() === columna) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(columna);
      this.sortDirection.set('asc');
    }
  }

  sortIconClass(columna: SortColumn): string {
    if (this.sortColumn() !== columna) return 'sort-icon sort-icon--off';
    return this.sortDirection() === 'asc'
      ? 'sort-icon sort-icon--asc'
      : 'sort-icon sort-icon--desc';
  }

  // ---------- Navegación ----------
  onVerColaborador(id: number): void {
    this.router.navigate(['/colaboradores', id]);
  }

  // ---------- Helpers ----------
  private uniqueSorted(values: (string | null | undefined)[]): string[] {
    const set = new Set<string>();
    for (const v of values) {
      if (v && v.trim() !== '') set.add(v);
    }
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    );
  }

  private cargarColaboradores(): void {
    this.loading.set(true);
    this.error.set(null);

    this.colaboradorService.getColaboradores().subscribe({
      next: (data) => {
        this.colaboradores.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar colaboradores', err);
        this.error.set('No se pudieron cargar los colaboradores.');
        this.loading.set(false);
      },
    });
  }
}