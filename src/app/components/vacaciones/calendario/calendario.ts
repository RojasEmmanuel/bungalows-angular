import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { VacacionesService } from '../../../services/vacaciones.service';
import { VacacionesResponse } from '../../../models/vacaciones.model';

/** Colaborador con sus periodos de vacaciones */
interface FilaColaborador {
  nombre: string;
  puesto: string;
  ubicacion: string;
  vacaciones: VacacionesResponse[];
}

/** Día del rango visible */
interface DiaCalendario {
  fecha: Date;
  iso: string;
  diaSemana: string;
  diaMes: number;
  esFinDeSemana: boolean;
  esHoy: boolean;
}

@Component({
  selector: 'app-vacaciones-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css',
})
export class VacacionesCalendario implements OnInit {
  private readonly vacacionesService = inject(VacacionesService);

  // ---------- Datos crudos ----------
  vacaciones = signal<VacacionesResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  private static readonly PALETA = [
    { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' }, // azul
    { bg: '#dcfce7', border: '#86efac', text: '#166534' }, // verde
    { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' }, // ámbar
    { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d' }, // rosa
    { bg: '#ede9fe', border: '#c4b5fd', text: '#5b21b6' }, // violeta
    { bg: '#cffafe', border: '#67e8f9', text: '#155e75' }, // cian
    { bg: '#ffedd5', border: '#fdba74', text: '#9a3412' }, // naranja
    { bg: '#e0e7ff', border: '#a5b4fc', text: '#3730a3' }, // índigo
  ];

  // ---------- Rango visible ----------
  /** Fecha de inicio del rango mostrado */
  fechaInicio = signal<Date>(this.hoyNormalizado());

  /** Número de días visibles */
  readonly DIAS_VISIBLES = 14;

  // ---------- Búsqueda ----------
  busqueda = signal('');

  // ---------- Fechas del rango ----------
  dias = computed<DiaCalendario[]>(() => {
    const inicio = this.fechaInicio();
    const hoy = this.hoyNormalizado();

    const resultado: DiaCalendario[] = [];
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 0; i < this.DIAS_VISIBLES; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);

      resultado.push({
        fecha,
        iso: this.toIso(fecha),
        diaSemana: diasSemana[fecha.getDay()],
        diaMes: fecha.getDate(),
        esFinDeSemana: fecha.getDay() === 0 || fecha.getDay() === 6,
        esHoy: fecha.getTime() === hoy.getTime(),
      });
    }

    return resultado;
  });

  /** Etiqueta del rango: "10 ene – 23 ene 2026" */
  etiquetaRango = computed(() => {
    const inicio = this.dias()[0]?.fecha;
    const fin = this.dias()[this.dias().length - 1]?.fecha;
    if (!inicio || !fin) return '';
    return `${this.formatoCorto(inicio)} – ${this.formatoCorto(fin)} ${fin.getFullYear()}`;
  });

  // ---------- Filas agrupadas por colaborador ----------
  filas = computed<FilaColaborador[]>(() => {
    const term = this.busqueda().trim().toLowerCase();
    const lista = this.vacaciones();

    const mapa = new Map<string, FilaColaborador>();

    for (const v of lista) {
      if (term && !v.nombreColaborador?.toLowerCase().includes(term)) continue;

      const key = v.nombreColaborador ?? '—';
      if (!mapa.has(key)) {
        mapa.set(key, {
          nombre: v.nombreColaborador,
          puesto: v.puesto,
          ubicacion: v.ubicacion,
          vacaciones: [],
        });
      }
      mapa.get(key)!.vacaciones.push(v);
    }

    return Array.from(mapa.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
    );
  });

  hayResultados = computed(() => this.filas().length > 0);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarVacaciones();
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

  // ---------- Navegación de fechas ----------
  anterior(): void {
    const nueva = new Date(this.fechaInicio());
    nueva.setDate(nueva.getDate() - 7);
    this.fechaInicio.set(nueva);
  }

  siguiente(): void {
    const nueva = new Date(this.fechaInicio());
    nueva.setDate(nueva.getDate() + 7);
    this.fechaInicio.set(nueva);
  }

  hoy(): void {
    this.fechaInicio.set(this.hoyNormalizado());
  }

  // ---------- Búsqueda ----------
  onBusqueda(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  limpiarBusqueda(): void {
    this.busqueda.set('');
  }

  // ---------- Posicionamiento de las barras ----------
  /**
   * Calcula el estilo CSS (left y width en %) de una barra de vacaciones
   * respecto al rango visible.
   */
  estiloBarra(v: VacacionesResponse): Record<string, string> {
    const inicioRango = this.dias()[0]?.fecha;
    const finRango = this.dias()[this.dias().length - 1]?.fecha;
    if (!inicioRango || !finRango) return { display: 'none' };

    const inicioVac = this.parseIso(v.fechaInicio);
    const finVac = this.parseIso(v.fechaFin);
    if (!inicioVac || !finVac) return { display: 'none' };

    if (finVac < inicioRango || inicioVac > finRango) {
      return { display: 'none' };
    }

    const inicioEfectivo = inicioVac < inicioRango ? inicioRango : inicioVac;
    const finEfectivo = finVac > finRango ? finRango : finVac;

    const totalDias = this.DIAS_VISIBLES;
    const offsetDias = this.diffDias(inicioRango, inicioEfectivo);
    const duracionDias = this.diffDias(inicioEfectivo, finEfectivo) + 1;

    const left = (offsetDias / totalDias) * 100;
    const width = (duracionDias / totalDias) * 100;

    // Color según id (rotativo)
    const color = this.colorDe(v.id);

    return {
      left: `${left}%`,
      width: `${width}%`,
      'background-color': color.bg,
      'border-color': color.border,
      color: color.text,
    };
  }

  private colorDe(id: number): { bg: string; border: string; text: string } {
    const idx = Math.abs(id) % VacacionesCalendario.PALETA.length;
    return VacacionesCalendario.PALETA[idx];
  }


  /** Clase según estatus */
  barraClase(v: VacacionesResponse): string {
    const e = (v.estatus ?? '').toUpperCase();
    if (e.includes('APROBADA') || e.includes('APROBADO')) return 'bar bar--ok';
    if (e.includes('PENDIENTE')) return 'bar bar--info';
    if (e.includes('RECHAZADA') || e.includes('CANCELADA')) return 'bar bar--danger';
    if (e.includes('DISFRUTADA') || e.includes('TOMADA')) return 'bar bar--muted';
    return 'bar';
  }

  etiquetaEstatus(v: VacacionesResponse): string {
    const e = (v.estatus ?? '').toUpperCase();
    if (e.includes('APROBADA')) return 'Aprobada';
    if (e.includes('PENDIENTE')) return 'Pendiente';
    if (e.includes('RECHAZADA')) return 'Rechazada';
    if (e.includes('CANCELADA')) return 'Cancelada';
    if (e.includes('DISFRUTADA')) return 'Disfrutada';
    return v.estatus ?? '—';
  }

  /** Tooltip al pasar el mouse por la barra */
  tooltip(v: VacacionesResponse): string {
    return `${this.etiquetaEstatus(v)} · ${v.fechaInicio} → ${v.fechaFin} (${v.diasOcupados} días)`;
  }

  iniciales(nombre: string | null | undefined): string {
    const limpio = nombre?.trim() ?? '';
    if (!limpio) return '?';
    const partes = limpio.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  // ---------- Helpers de fecha ----------
  private hoyNormalizado(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private parseIso(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const [anio, mes, dia] = iso.split('-').map(Number);
    if (!anio || !mes || !dia) return null;
    return new Date(anio, mes - 1, dia);
  }

  private toIso(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private diffDias(a: Date, b: Date): number {
    const ms = b.getTime() - a.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
  }

  private formatoCorto(d: Date): string {
    const meses = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun',
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
    ];
    return `${d.getDate()} ${meses[d.getMonth()]}`;
  }


  
}