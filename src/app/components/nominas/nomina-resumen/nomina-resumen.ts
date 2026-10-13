// nomina-resumen/nomina-resumen.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PercepcionRequest, DeduccionRequest } from '../../../models/nomina.model'; 
import { LaboralNominaResponse } from '../../../models/laboral.model';

@Component({
  selector: 'app-nomina-resumen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-2xl bg-white p-6" style="border:1px solid var(--color-line)">
      <h2 class="text-xl font-bold" style="color: var(--color-ink)">Resumen de Nómina</h2>

      @if (!laboral) {
        <p class="mt-4 text-sm" style="color: var(--color-ink-soft)">
          Selecciona un colaborador para ver su información.
        </p>
      } @else {
        <!-- Datos del colaborador -->
        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <p style="color: var(--color-ink-soft)">Nombre: <span style="color:var(--color-ink)">{{ laboral.nombreColaborador }}</span></p>
          <p style="color: var(--color-ink-soft)">RFC: <span style="color:var(--color-ink)">{{ laboral.rfc }}</span></p>
          <p style="color: var(--color-ink-soft)">CURP: <span style="color:var(--color-ink)">{{ laboral.curp }}</span></p>
          <p style="color: var(--color-ink-soft)">NSS: <span style="color:var(--color-ink)">{{ laboral.nss }}</span></p>
          <p style="color: var(--color-ink-soft)">Ingreso: <span style="color:var(--color-ink)">{{ laboral.fechaIngreso }}</span></p>
          <p style="color: var(--color-ink-soft)">Jornada: <span style="color:var(--color-ink)">{{ laboral.jornada }}</span></p>
          <p style="color: var(--color-ink-soft)">Puesto: <span style="color:var(--color-ink)">{{ laboral.puesto }}</span></p>
          <p style="color: var(--color-ink-soft)">Ubicación: <span style="color:var(--color-ink)">{{ laboral.ubicacion }}</span></p>
          <p style="color: var(--color-ink-soft)">Sueldo: <span style="color:var(--color-ink)">{{ laboral.sueldo | number:'1.2-2' }}</span></p>
        </div>
      }

      <!-- Periodo -->
      <div class="mt-6">
        <h3 class="text-base font-semibold" style="color: var(--color-ink)">Periodo</h3>
        @if (periodo.inicio && periodo.fin) {
          <p class="mt-2 text-sm" style="color: var(--color-ink-soft)">
            {{ periodo.inicio }} — {{ periodo.fin }}
            <span class="ml-2" style="color: var(--color-brand)">({{ periodo.dias }} días)</span>
          </p>
        } @else {
          <p class="mt-2 text-sm" style="color: var(--color-ink-soft)">Sin periodo definido.</p>
        }
      </div>

      <!-- Percepciones -->
      <div class="mt-6">
        <h3 class="text-base font-semibold" style="color: var(--color-ink)">Percepciones</h3>
        @if (percepciones.length === 0) {
          <p class="mt-2 text-sm" style="color: var(--color-ink-soft)">Sin percepciones.</p>
        } @else {
          <ul class="mt-2 space-y-1">
            @for (p of percepciones; track $index) {
              <li class="flex justify-between text-sm px-3 py-2 rounded-lg"
                  style="background: var(--color-brand-softer); color: var(--color-ink)">
                <span>{{ p.concepto }}</span>
                <span>{{ p.monto | number:'1.2-2' }}</span>
              </li>
            }
          </ul>
        }
      </div>

      <!-- Deducciones -->
      <div class="mt-6">
        <h3 class="text-base font-semibold" style="color: var(--color-ink)">Deducciones</h3>
        @if (deducciones.length === 0) {
          <p class="mt-2 text-sm" style="color: var(--color-ink-soft)">Sin deducciones.</p>
        } @else {
          <ul class="mt-2 space-y-1">
            @for (d of deducciones; track $index) {
              <li class="flex justify-between text-sm px-3 py-2 rounded-lg"
                  style="background: var(--color-brand-softer); color: var(--color-ink)">
                <span>{{ d.tipo }}</span>
                <span>{{ d.monto | number:'1.2-2' }}</span>
              </li>
            }
          </ul>
        }
      </div>

      <!-- Totales -->
      <div class="mt-6 pt-4" style="border-top:1px solid var(--color-line)">
        <div class="flex justify-between text-sm" style="color: var(--color-ink-soft)">
          <span>Total percepciones</span>
          <span style="color: var(--color-ink)">{{ totalPercepciones | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-sm mt-1" style="color: var(--color-ink-soft)">
          <span>Total deducciones</span>
          <span style="color: var(--color-ink)">{{ totalDeducciones | number:'1.2-2' }}</span>
        </div>
        <div class="flex justify-between text-base font-semibold mt-2" style="color: var(--color-ink)">
          <span>Neto</span>
          <span>{{ neto | number:'1.2-2' }}</span>
        </div>
      </div>
    </section>
  `,
})
export class NominaResumenComponent {
  @Input() laboral: LaboralNominaResponse | null = null;
  @Input() periodo: { inicio: string; fin: string; dias: number } = { inicio: '', fin: '', dias: 0 };
  @Input() percepciones: PercepcionRequest[] = [];
  @Input() deducciones: DeduccionRequest[] = [];

  get totalPercepciones(): number {
    return this.percepciones.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  }
  get totalDeducciones(): number {
    return this.deducciones.reduce((acc, d) => acc + Number(d.monto || 0), 0);
  }
  get neto(): number {
    return this.totalPercepciones - this.totalDeducciones;
  }
}