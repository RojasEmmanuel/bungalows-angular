import { Component, computed, inject, signal, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';

import { VacacionesService } from '../../../services/vacaciones.service';
import { EnumsService } from '../../../services/enums.service';
import { PuestoService } from '../../../services/puesto.service';
import { UbicacionService } from '../../../services/ubicacion.service';

import { VacacionesResponse } from '../../../models/vacaciones.model';
import { EnumOption } from '../../../models/enum-option.model';
import { PuestoResponse } from '../../../models/puesto.model';
import { UbicacionResponse } from '../../../models/ubicacion.model';

type SortColumn =
  | 'nombreColaborador'
  | 'estatus'
  | 'fechaInicio'
  | 'fechaFin'
  | null;

type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-vacaciones-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vacaciones-table.html',
  styleUrl: './vacaciones-table.css',
})
export class VacacionesTable implements OnInit {
  private readonly vacacionesService = inject(VacacionesService);
  private readonly enumsService = inject(EnumsService);
  private readonly puestoService = inject(PuestoService);
  private readonly ubicacionService = inject(UbicacionService);

  editar = output<VacacionesResponse>();
  eliminar = output<VacacionesResponse>();


  // ---------- Datos crudos ----------
  vacaciones = signal<VacacionesResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // ---------- Catálogos ----------
  estatusList = signal<EnumOption[]>([]);
  puestos = signal<PuestoResponse[]>([]);
  ubicaciones = signal<UbicacionResponse[]>([]);

  // ---------- Filtros ----------
  busqueda = signal('');
  filtroEstatus = signal('');
  filtroPuesto = signal('');
  filtroUbicacion = signal('');

  // ---------- Ordenamiento ----------
  sortColumn = signal<SortColumn>(null);
  sortDirection = signal<SortDirection>('asc');

  // ---------- Resultado: filtrado + ordenado ----------
  vacacionesFiltradas = computed(() => {
    let lista = this.vacaciones();

    // Filtro por nombre de colaborador
    const term = this.busqueda().trim().toLowerCase();
    if (term) {
      lista = lista.filter((v) =>
        v.nombreColaborador?.toLowerCase().includes(term)
      );
    }

    // Filtro por estatus (case-insensitive: "Pagado" vs "PAGADO")
    if (this.filtroEstatus()) {
      const f = this.filtroEstatus().toLowerCase();
      lista = lista.filter(
        (v) => (v.estatus ?? '').toLowerCase() === f
      );
    }

    // Filtro por puesto
    if (this.filtroPuesto()) {
      lista = lista.filter((v) => v.puesto === this.filtroPuesto());
    }

    // Filtro por ubicación
    if (this.filtroUbicacion()) {
      lista = lista.filter((v) => v.ubicacion === this.filtroUbicacion());
    }

    // Ordenamiento
    const col = this.sortColumn();
    if (col) {
      const dir = this.sortDirection() === 'asc' ? 1 : -1;
      lista = [...lista].sort((a, b) => {
        const va = a[col];
        const vb = b[col];

        if (typeof va === 'string' && typeof vb === 'string') {
          return va.localeCompare(vb, 'es', { sensitivity: 'base' }) * dir;
        }
        if (typeof va === 'number' && typeof vb === 'number') {
          return (va - vb) * dir;
        }
        // fechas YYYY-MM-DD comparables lexicográficamente
        return String(va ?? '').localeCompare(String(vb ?? '')) * dir;
      });
    }

    return lista;
  });

  // ---------- Computed auxiliares ----------
  hayFiltrosActivos = computed(
    () =>
      !!this.busqueda().trim() ||
      !!this.filtroEstatus() ||
      !!this.filtroPuesto() ||
      !!this.filtroUbicacion()
  );

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarVacaciones();
  }

  // ---------- Cargas ----------
  private cargarCatalogos(): void {
    forkJoin({
      estatus: this.enumsService
        .getEstatusVacaciones()
        .pipe(catchError(() => of([] as EnumOption[]))),
      puestos: this.puestoService
        .getPuestos()
        .pipe(catchError(() => of([] as PuestoResponse[]))),
      ubicaciones: this.ubicacionService
        .getUbicaciones()
        .pipe(catchError(() => of([] as UbicacionResponse[]))),
    }).subscribe({
      next: ({ estatus, puestos, ubicaciones }) => {
        this.estatusList.set(estatus);
        this.puestos.set(puestos);
        this.ubicaciones.set(ubicaciones);
      },
    });
  }

  private cargarVacaciones(): void {
    this.loading.set(true);
    this.error.set(null);

    this.vacacionesService.getVacaciones().subscribe({
      next: (data) => {
        this.vacaciones.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar vacaciones', err);
        this.error.set('No se pudieron cargar las vacaciones.');
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

  onFiltroPuesto(event: Event): void {
    this.filtroPuesto.set((event.target as HTMLSelectElement).value);
  }

  onFiltroUbicacion(event: Event): void {
    this.filtroUbicacion.set((event.target as HTMLSelectElement).value);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroEstatus.set('');
    this.filtroPuesto.set('');
    this.filtroUbicacion.set('');
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
  labelEstatus(value: string | null | undefined): string {
    if (!value) return '—';
    const v = value.toLowerCase();
    const opt = this.estatusList().find(
      (e) => e.value.toLowerCase() === v || e.label.toLowerCase() === v
    );
    return opt?.label ?? value;
  }

  estatusClase(value: string | null | undefined): string {
    const v = (value ?? '').toUpperCase();
    if (v.includes('APROBADA') || v.includes('APROBADO')) return 'badge badge--ok';
    if (v.includes('PENDIENTE')) return 'badge badge--info';
    if (v.includes('RECHAZADA') || v.includes('RECHAZADO') || v.includes('CANCELADA'))
      return 'badge badge--danger';
    if (v.includes('DISFRUTADA') || v.includes('TOMADA')) return 'badge badge--muted';
    return 'badge';
  }

  recargar(): void {
    this.cargarVacaciones();
  }

  

  onEditar(v: VacacionesResponse): void {
    this.editar.emit(v);
  }

  onEliminar(v: VacacionesResponse): void {
    this.eliminar.emit(v);
  }
}