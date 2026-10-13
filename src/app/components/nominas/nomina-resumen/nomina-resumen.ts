// nomina-resumen/nomina-resumen.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PercepcionRequest, DeduccionRequest } from '../../../models/nomina.model';
import { LaboralNominaResponse } from '../../../models/laboral.model';
import { EnumOption } from '../../../models/enum-option.model';
import { formatearPeriodo } from '../../../utils/date-format.util';
import { EmptyStateComponent } from '../../empty-state/empty-state';

@Component({
  selector: 'app-nomina-resumen',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: 'nomina-resumen.html'
})
export class NominaResumenComponent {
  @Input() laboral: LaboralNominaResponse | null = null;
  @Input() periodo: { inicio: string; fin: string; dias: number } = { inicio: '', fin: '', dias: 0 };
  @Input() percepciones: PercepcionRequest[] = [];
  @Input() deducciones: DeduccionRequest[] = [];
  @Input() tiposDeducciones: EnumOption[] = [];

  private get tiposMap(): Map<string, string> {
    return new Map(this.tiposDeducciones.map((t) => [t.value, t.label]));
  }

  get periodoTexto(): string {
    return formatearPeriodo(this.periodo.inicio, this.periodo.fin);
  }

  labelDeduccion(value: string): string {
    return this.tiposMap.get(value) ?? value;
  }

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