// nomina-form/nomina-form.component.ts
import { Component, OnInit, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';

import { ColaboradorService } from '../../../services/colaborador.service';
import { LaboralService } from '../../../services/laboral.service';
import { NominaService } from '../../../services/nomina.service';
import { EnumsService } from '../../../services/enums.service';
import { PercepcionRequest, DeduccionRequest, NominaRequest } from '../../../models/nomina.model';
import { LaboralNominaResponse } from '../../../models/laboral.model';
import { ColaboradorOptionResponse } from '../../../models/colaborador.model';
import { EnumOption } from '../../../models/enum-option.model';

@Component({
  selector: 'app-nomina-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <section class="rounded-2xl bg-white p-6">
      <h2 class="text-xl font-bold" style="color: var(--color-ink)">Registrar Nómina</h2>

      <!-- ===== Colaborador (buscador) ===== -->
      <div class="mt-5">
        <label class="block text-sm font-medium mb-1" style="color: var(--color-ink-soft)">
          Colaborador
        </label>
        <div class="relative">
          <input
            type="text"
            [(ngModel)]="busquedaColaborador"
            (ngModelChange)="onBuscarColaborador($event)"
            (focus)="mostrarLista = true"
            (blur)="onBlurBusqueda()"
            placeholder="Escribe el nombre del colaborador..."
            class="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style="background: var(--color-brand-softer); border:1px solid var(--color-line); color:var(--color-ink)"
          />

          @if (mostrarLista && resultadosColaborador.length > 0 && !colaboradorSeleccionado) {
            <ul
              class="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg"
              style="background: var(--color-surface); border:1px solid var(--color-line)"
            >
              @for (c of resultadosColaborador; track c.id) {
                <li
                  (mousedown)="seleccionarColaborador(c)"
                  class="px-3 py-2 text-sm cursor-pointer"
                  style="color: var(--color-ink)"
                >
                  {{ c.nombreCompleto }}
                </li>
              }
            </ul>
          }
        </div>

        @if (colaboradorSeleccionado) {
          <p class="mt-2 text-sm" style="color: var(--color-brand)">
            Seleccionado: {{ colaboradorSeleccionado.nombreCompleto }}
            <button
              type="button"
              (click)="limpiarColaborador()"
              class="ml-2 text-xs underline"
              style="color: var(--color-ink-soft)"
            >
              cambiar
            </button>
          </p>
        }
      </div>

      <!-- ===== Periodo ===== -->
      <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-ink-soft)">Fecha inicio</label>
          <input
            type="date"
            [(ngModel)]="fechaInicio"
            (ngModelChange)="recalcularDias()"
            class="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style="background: var(--color-brand-softer); border:1px solid var(--color-line); color:var(--color-ink)"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-ink-soft)">Fecha fin</label>
          <input
            type="date"
            [(ngModel)]="fechaFin"
            (ngModelChange)="recalcularDias()"
            class="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style="background: var(--color-brand-softer); border:1px solid var(--color-line); color:var(--color-ink)"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1" style="color: var(--color-ink-soft)">Días laborales</label>
          <input
            type="number"
            min="0"
            [(ngModel)]="diasPago"
            (ngModelChange)="onDiasManual($event)"
            class="w-full rounded-lg px-3 py-2 text-sm outline-none tabular-nums"
            style="background: var(--color-brand-soft); border:1px solid var(--color-line); color:var(--color-ink)"
          />
        </div>
      </div>

      <!-- ===== Percepciones ===== -->
      <div class="mt-6">
        <h3 class="text-base font-semibold" style="color: var(--color-ink)">Percepciones</h3>

        <div class="mt-3 flex flex-col md:flex-row md:items-center gap-2">
          <input
            type="text"
            [(ngModel)]="percepcionConcepto"
            placeholder="Concepto"
            class="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style="background: var(--color-brand-softer); border:1px solid var(--color-line); color:var(--color-ink)"
          />
          <input
            type="number"
            [(ngModel)]="percepcionMonto"
            placeholder="Monto"
            class="md:w-40 rounded-lg px-3 py-2 text-sm outline-none tabular-nums"
            style="background: var(--color-brand-softer); border:1px solid var(--color-line); color:var(--color-ink)"
          />
          <button
            type="button"
            (click)="agregarPercepcion()"
            [disabled]="!percepcionConcepto.trim() || percepcionMonto === null"
            class="rounded-lg px-4 py-2 text-sm font-medium"
            style="background: var(--color-brand); color:#fff"
          >
            Agregar
          </button>
        </div>

        @if (percepciones.length > 0) {
          <div class="mt-3 flex flex-wrap gap-2">
            @for (p of percepciones; track $index) {
              <span
                class="inline-flex items-center gap-2 rounded-full pl-3 pr-1 py-1 text-xs"
                style="background: var(--color-brand); color:#fff"
              >
                <span class="font-medium">{{ p.concepto }}</span>
                <span class="tabular-nums" style="opacity:.85">
                  {{ p.monto | number:'1.2-2' }}
                </span>
                <button
                  type="button"
                  (click)="quitarPercepcion($index)"
                  class="ml-1 w-5 h-5 inline-flex items-center justify-center rounded-full text-xs font-bold"
                  style="background: rgba(255,255,255,.18); color:#fff"
                  aria-label="Quitar"
                >
                  ×
                </button>
              </span>
            }
          </div>
        }
      </div>

      <!-- ===== Deducciones ===== -->
      <div class="mt-6">
        <h3 class="text-base font-semibold" style="color: var(--color-ink)">Deducciones</h3>

        <div class="mt-3 flex flex-col md:flex-row md:items-center gap-2">
          <select
            [(ngModel)]="deduccionTipo"
            class="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
            style="background: var(--color-brand-softer); border:1px solid var(--color-line); color:var(--color-ink)"
          >
            <option value="">Selecciona un tipo</option>
            @for (t of tiposDeducciones; track t.value) {
              <option [value]="t.value">{{ t.label }}</option>
            }
          </select>
          <input
            type="number"
            [(ngModel)]="deduccionMonto"
            placeholder="Monto"
            class="md:w-40 rounded-lg px-3 py-2 text-sm outline-none tabular-nums"
            style="background: var(--color-brand-softer); border:1px solid var(--color-line); color:var(--color-ink)"
          />
          <button
            type="button"
            (click)="agregarDeduccion()"
            [disabled]="!deduccionTipo || deduccionMonto === null"
            class="rounded-lg px-4 py-2 text-sm font-medium"
            style="background: var(--color-brand); color:#fff"
          >
            Agregar
          </button>
        </div>

        @if (deducciones.length > 0) {
          <div class="mt-3 flex flex-wrap gap-2">
            @for (d of deducciones; track $index) {
              <span
                class="inline-flex items-center gap-2 rounded-full pl-3 pr-1 py-1 text-xs"
                style="background: var(--color-brand); color:#fff"
              >
                <span class="font-medium">{{ labelTipo(d.tipo) }}</span>
                <span class="tabular-nums" style="opacity:.85">
                  {{ d.monto | number:'1.2-2' }}
                </span>
                <button
                  type="button"
                  (click)="quitarDeduccion($index)"
                  class="ml-1 w-5 h-5 inline-flex items-center justify-center rounded-full text-xs font-bold"
                  style="background: rgba(255,255,255,.18); color:#fff"
                  aria-label="Quitar"
                >
                  ×
                </button>
              </span>
            }
          </div>
        }
      </div>

      <!-- ===== Acciones ===== -->
      <div class="mt-6 flex justify-end">
        <button
          type="button"
          (click)="registrarNomina()"
          [disabled]="!puedeRegistrar"
          class="rounded-lg px-5 py-2 text-sm font-semibold"
          style="background: var(--color-brand); color:#fff"
        >
          Registrar Nómina
        </button>
      </div>
    </section>
  `,
})
export class NominaFormComponent implements OnInit {
  private colaboradorService = inject(ColaboradorService);
  private laboralService = inject(LaboralService);
  private nominaService = inject(NominaService);
  private enumsService = inject(EnumsService);

  // Salidas hacia el componente resumen
  laboralSeleccionadoChange = output<LaboralNominaResponse | null>();
  periodoChange = output<{ inicio: string; fin: string; dias: number }>();
  percepcionesChange = output<PercepcionRequest[]>();
  deduccionesChange = output<DeduccionRequest[]>();
  tiposDeduccionesChange = output<EnumOption[]>();

  // Colaborador
  busquedaColaborador = '';
  resultadosColaborador: ColaboradorOptionResponse[] = [];
  colaboradorSeleccionado: ColaboradorOptionResponse | null = null;
  mostrarLista = false;
  private busqueda$ = new Subject<string>();

  // Laboral
  laboral: LaboralNominaResponse | null = null;

  // Periodo
  fechaInicio = '';
  fechaFin = '';
  diasPago = 0;
  /** Bandera: el usuario tocó los días manualmente */
  private diasEditadosManualmente = false;

  // Percepciones
  percepcionConcepto = '';
  percepcionMonto: number | null = null;
  percepciones: PercepcionRequest[] = [];

  // Deducciones
  tiposDeducciones: EnumOption[] = [];
  deduccionTipo = '';
  deduccionMonto: number | null = null;
  deducciones: DeduccionRequest[] = [];

  ngOnInit(): void {
    this.busqueda$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) =>
          term.trim().length === 0
            ? of([])
            : this.colaboradorService.getColaboradoresToSelect()
        )
      )
      .subscribe((colabs) => {
        const term = this.busquedaColaborador.toLowerCase().trim();
        this.resultadosColaborador = colabs
          .filter((c) => c.nombreCompleto.toLowerCase().includes(term))
          .slice(0, 20);
      });

    this.enumsService.getTiposDeducciones().subscribe((tipos: EnumOption[]) => {
      this.tiposDeducciones = tipos;
      this.tiposDeduccionesChange.emit(tipos);
    });
  }

  onBuscarColaborador(term: string): void {
    this.colaboradorSeleccionado = null;
    this.mostrarLista = true;
    this.busqueda$.next(term);
  }

  onBlurBusqueda(): void {
    setTimeout(() => (this.mostrarLista = false), 150);
  }

  seleccionarColaborador(c: ColaboradorOptionResponse): void {
    this.colaboradorSeleccionado = c;
    this.busquedaColaborador = c.nombreCompleto;
    this.mostrarLista = false;

    this.laboralService.getLaboralToNomina(c.id).subscribe((lab) => {
      this.laboral = lab;
      this.laboralSeleccionadoChange.emit(lab);

      const concepto = `Pago por ${this.diasPago || 0} días laborales`;
      this.percepcionConcepto = concepto;
      this.percepcionMonto = lab.sueldo;
    });
  }

  limpiarColaborador(): void {
    this.colaboradorSeleccionado = null;
    this.busquedaColaborador = '';
    this.resultadosColaborador = [];
    this.laboral = null;
    this.laboralSeleccionadoChange.emit(null);
    this.percepciones = [];
    this.deducciones = [];
    this.percepcionesChange.emit([]);
    this.deduccionesChange.emit([]);
  }

  /** Recalcula días solo si el usuario no los editó manualmente */
  recalcularDias(): void {
    if (!this.diasEditadosManualmente) {
      if (!this.fechaInicio || !this.fechaFin) {
        this.diasPago = 0;
      } else {
        const ini = new Date(this.fechaInicio);
        const fin = new Date(this.fechaFin);
        const diff = Math.floor((fin.getTime() - ini.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        this.diasPago = diff > 0 ? diff : 0;
      }
    }

    // Actualiza el concepto por defecto solo si aún no hay percepciones
    if (this.laboral && this.percepciones.length === 0) {
      this.percepcionConcepto = `Pago por ${this.diasPago} días laborales`;
    }

    this.periodoChange.emit({
      inicio: this.fechaInicio,
      fin: this.fechaFin,
      dias: this.diasPago,
    });
  }

  /** El usuario tocó el campo de días → dejamos de autocalcular */
  onDiasManual(valor: number): void {
    const n = Number(valor);
    this.diasPago = isNaN(n) || n < 0 ? 0 : n;
    this.diasEditadosManualmente = true;

    if (this.laboral && this.percepciones.length === 0) {
      this.percepcionConcepto = `Pago por ${this.diasPago} días laborales`;
    }

    this.periodoChange.emit({
      inicio: this.fechaInicio,
      fin: this.fechaFin,
      dias: this.diasPago,
    });
  }

  agregarPercepcion(): void {
    if (!this.percepcionConcepto.trim() || this.percepcionMonto === null) return;
    this.percepciones = [
      ...this.percepciones,
      { concepto: this.percepcionConcepto.trim(), monto: Number(this.percepcionMonto) },
    ];
    this.percepcionConcepto = '';
    this.percepcionMonto = null;
    this.percepcionesChange.emit(this.percepciones);
  }

  quitarPercepcion(index: number): void {
    this.percepciones = this.percepciones.filter((_, i) => i !== index);
    this.percepcionesChange.emit(this.percepciones);
  }

  agregarDeduccion(): void {
    if (!this.deduccionTipo || this.deduccionMonto === null) return;
    this.deducciones = [
      ...this.deducciones,
      { tipo: this.deduccionTipo, monto: Number(this.deduccionMonto) },
    ];
    this.deduccionTipo = '';
    this.deduccionMonto = null;
    this.deduccionesChange.emit(this.deducciones);
  }

  quitarDeduccion(index: number): void {
    this.deducciones = this.deducciones.filter((_, i) => i !== index);
    this.deduccionesChange.emit(this.deducciones);
  }

  labelTipo(value: string): string {
    return this.tiposDeducciones.find((t) => t.value === value)?.label ?? value;
  }

  get puedeRegistrar(): boolean {
    return (
      !!this.laboral &&
      !!this.fechaInicio &&
      !!this.fechaFin &&
      this.diasPago > 0 &&
      this.percepciones.length > 0 &&
      this.deducciones.length > 0
    );
  }

  registrarNomina(): void {
    if (!this.puedeRegistrar || !this.laboral) return;

    const request: NominaRequest = {
      laboralId: this.laboral.id,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      diasPago: this.diasPago,
      percepciones: this.percepciones,
      deducciones: this.deducciones,
    };

    this.nominaService.crearNomina(request).subscribe(() => {
      this.percepciones = [];
      this.deducciones = [];
      this.fechaInicio = '';
      this.fechaFin = '';
      this.diasPago = 0;
      this.diasEditadosManualmente = false;
      this.percepcionesChange.emit([]);
      this.deduccionesChange.emit([]);
      this.periodoChange.emit({ inicio: '', fin: '', dias: 0 });
    });
  }
}