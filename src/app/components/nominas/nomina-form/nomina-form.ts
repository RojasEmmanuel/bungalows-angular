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
  templateUrl: 'nomina-form.html'
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

  /** Emite el id de la nómina recién creada (para que el padre maneje la descarga) */
  nominaCreada = output<number>();

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

    if (this.laboral && this.percepciones.length === 0) {
      this.percepcionConcepto = `Pago por ${this.diasPago} días laborales`;
    }

    this.periodoChange.emit({
      inicio: this.fechaInicio,
      fin: this.fechaFin,
      dias: this.diasPago,
    });
  }

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

    this.nominaService.crearNomina(request).subscribe({
      next: (id) => {
        // Notifica al padre con el id para que muestre el botón de descarga
        this.nominaCreada.emit(id);

        // Reset SOLO de percepciones y deducciones (el periodo se conserva
        // para permitir registrar varias nóminas con el mismo rango de fechas).
        this.percepciones = [];
        this.deducciones = [];
        this.percepcionesChange.emit([]);
        this.deduccionesChange.emit([]);

        // Re-prellenar el concepto de percepción con el periodo actual,
        // así el usuario solo tiene que escribir/confirmar el monto.
        if (this.laboral) {
          this.percepcionConcepto = `Pago por ${this.diasPago} días laborales`;
          this.percepcionMonto = this.laboral.sueldo;
        }

        // NO tocamos: fechaInicio, fechaFin, diasPago, diasEditadosManualmente.
        // Reemitimos el periodo para que el padre (resumen) siga consistente.
        this.periodoChange.emit({
          inicio: this.fechaInicio,
          fin: this.fechaFin,
          dias: this.diasPago,
        });
      },
      error: (err) => {
        console.error('Error al crear nómina', err);
      },
    });
  }
}