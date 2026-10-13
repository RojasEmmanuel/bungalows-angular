// nominas.component.ts
import { Component, signal } from '@angular/core';
import { NominaFormComponent } from '../../components/nominas/nomina-form/nomina-form'; 
import { NominaResumenComponent } from '../../components/nominas/nomina-resumen/nomina-resumen';
import { PercepcionRequest, DeduccionRequest } from '../../models/nomina.model'; 
import { LaboralNominaResponse } from '../../models/laboral.model';
import { EnumOption } from '../../models/enum-option.model';
@Component({
  selector: 'app-nominas',
  standalone: true,
  imports: [NominaFormComponent, NominaResumenComponent],
  template: `
    <section class="rounded-2xl p-6">
      <div class="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <app-nomina-form
          (laboralSeleccionadoChange)="laboral.set($event)"
          (periodoChange)="periodo.set($event)"
          (percepcionesChange)="percepciones.set($event)"
          (deduccionesChange)="deducciones.set($event)"
          (tiposDeduccionesChange)="tiposDeducciones.set($event)"  
        />

        <app-nomina-resumen
          [laboral]="laboral()"
          [periodo]="periodo()"
          [percepciones]="percepciones()"
          [deducciones]="deducciones()"
          [tiposDeducciones]="tiposDeducciones()"
        />
      </div>
    </section>
  `,
})
export class NominasComponent {
  laboral = signal<LaboralNominaResponse | null>(null);
  periodo = signal<{ inicio: string; fin: string; dias: number }>({ inicio: '', fin: '', dias: 0 });
  percepciones = signal<PercepcionRequest[]>([]);
  deducciones = signal<DeduccionRequest[]>([]);
  tiposDeducciones = signal<EnumOption[]>([]); 
}