import { Component, OnInit, inject, output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of, finalize } from 'rxjs';

import { ColaboradorService } from '../../../services/colaborador.service';
import { LaboralService } from '../../../services/laboral.service';
import { NominaService } from '../../../services/nomina.service';
import { EnumsService } from '../../../services/enums.service';
import { PrestamoService } from '../../../services/prestamo.service';
import { PercepcionRequest, DeduccionRequest, NominaRequest } from '../../../models/nomina.model';
import { LaboralNominaResponse } from '../../../models/laboral.model';
import { ColaboradorOptionResponse } from '../../../models/colaborador.model';
import { EnumOption } from '../../../models/enum-option.model';
import { DeudaResponse } from '../../../models/prestamo.model';

@Component({
  selector: 'app-nomina-form',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: 'nomina-form.html',
  styleUrl:'nomina-form.css'
})
export class NominaFormComponent implements OnInit {
  private colaboradorService = inject(ColaboradorService);
  private laboralService = inject(LaboralService);
  private nominaService = inject(NominaService);
  private enumsService = inject(EnumsService);
  private prestamoService = inject(PrestamoService);
  private cdr = inject(ChangeDetectorRef); // Para forzar actualización de vista

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

  // Deuda / Préstamo
  deuda: DeudaResponse | null = null;
  prestamoDeduccionMonto: number = 0;
  cargandoDeuda = false;
  errorDeuda = false;
  private tiposDeduccionesListos = false;
  private deudaPendienteDeCargar: number | null = null;

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
        this.cdr.detectChanges();
      });

    this.enumsService.getTiposDeducciones().subscribe((tipos: EnumOption[]) => {
      this.tiposDeducciones = tipos;
      this.tiposDeduccionesChange.emit(tipos);
      this.tiposDeduccionesListos = true;

      if (this.deudaPendienteDeCargar !== null) {
        this.prellenarDeduccionPrestamo(this.deudaPendienteDeCargar);
        this.deudaPendienteDeCargar = null;
      }
      this.cdr.detectChanges();
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

    // Reset de estado de deuda
    this.deuda = null;
    this.prestamoDeduccionMonto = 0;
    this.cargandoDeuda = true;
    this.errorDeuda = false;
    this.deudaPendienteDeCargar = null;

    this.laboralService.getLaboralToNomina(c.id).subscribe((lab) => {
      this.laboral = lab;
      this.laboralSeleccionadoChange.emit(lab);

      const concepto = `Pago por ${this.diasPago || 0} días laborales`;
      this.percepcionConcepto = concepto;
      this.percepcionMonto = lab.sueldo;
      this.cdr.detectChanges();
    });

    // CONSULTAR DEUDA CON LOGS Y FINALIZE
    console.log('⏳ Iniciando petición de deuda para el colaborador:', c.id);
    
    this.prestamoService.getDeuda(c.id)
      .pipe(
        finalize(() => {
          // Esto SIEMPRE se ejecuta (éxito o error)
          console.log('🏁 Petición de deuda finalizada.');
          this.cargandoDeuda = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (deuda) => {
          console.log('✅ Deuda recibida del backend:', deuda);
          this.deuda = deuda;
          
          if (deuda && deuda.pendiente > 0) {
            if (this.tiposDeduccionesListos) {
              this.prellenarDeduccionPrestamo(deuda.pendiente);
            } else {
              this.deudaPendienteDeCargar = deuda.pendiente;
            }
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          // ESTE LOG ES VITAL PARA VER QUÉ ESTÁ FALLANDO
          console.error('❌ Error HTTP al cargar la deuda:', err);
          this.errorDeuda = true;
          this.deuda = null;
        },
      });
  }

  private prellenarDeduccionPrestamo(pendiente: number): void {
    this.deduccionTipo = this.resolverTipoPrestamo();
    this.deduccionMonto = pendiente;
    this.cdr.detectChanges();
  }

  private resolverTipoPrestamo(): string {
    const tipo = this.tiposDeducciones.find(
      (t) =>
        t.value?.toLowerCase().includes('prestamo') ||
        t.label?.toLowerCase().includes('préstamo') ||
        t.label?.toLowerCase().includes('prestamo')
    );
    return tipo?.value ?? '';
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

    this.deuda = null;
    this.prestamoDeduccionMonto = 0;
    this.deduccionTipo = '';
    this.deduccionMonto = null;
    this.cargandoDeuda = false;
    this.errorDeuda = false;
    this.deudaPendienteDeCargar = null;
    this.cdr.detectChanges();
  }

  // ... (el resto de los métodos recalcularDias, agregarPercepcion, etc. se mantienen EXACTAMENTE IGUAL) ...

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
    this.periodoChange.emit({ inicio: this.fechaInicio, fin: this.fechaFin, dias: this.diasPago });
  }

  onDiasManual(valor: number): void {
    const n = Number(valor);
    this.diasPago = isNaN(n) || n < 0 ? 0 : n;
    this.diasEditadosManualmente = true;
    if (this.laboral && this.percepciones.length === 0) {
      this.percepcionConcepto = `Pago por ${this.diasPago} días laborales`;
    }
    this.periodoChange.emit({ inicio: this.fechaInicio, fin: this.fechaFin, dias: this.diasPago });
  }

  agregarPercepcion(): void {
    if (!this.percepcionConcepto.trim() || this.percepcionMonto === null) return;
    this.percepciones = [...this.percepciones, { concepto: this.percepcionConcepto.trim(), monto: Number(this.percepcionMonto) }];
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
    const monto = Number(this.deduccionMonto);
    const tipoPrestamo = this.resolverTipoPrestamo();
    const esPrestamo = this.deduccionTipo === tipoPrestamo;

    if (esPrestamo && this.deuda && monto > this.deuda.pendiente) {
      this.deduccionMonto = this.deuda.pendiente;
      return;
    }

    this.deducciones = [...this.deducciones, { tipo: this.deduccionTipo, monto }];
    if (esPrestamo) this.prestamoDeduccionMonto = monto;

    this.deduccionTipo = '';
    this.deduccionMonto = null;
    this.deduccionesChange.emit(this.deducciones);
  }

  quitarDeduccion(index: number): void {
    const deduccion = this.deducciones[index];
    const tipoPrestamo = this.resolverTipoPrestamo();
    if (deduccion && deduccion.tipo === tipoPrestamo) this.prestamoDeduccionMonto = 0;
    this.deducciones = this.deducciones.filter((_, i) => i !== index);
    this.deduccionesChange.emit(this.deducciones);
  }

  labelTipo(value: string): string {
    return this.tiposDeducciones.find((t) => t.value === value)?.label ?? value;
  }

  get puedeRegistrar(): boolean {
    return !!this.laboral && !!this.fechaInicio && !!this.fechaFin && this.diasPago > 0 && this.percepciones.length > 0 && this.deducciones.length > 0;
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

    const colaboradorId = this.colaboradorSeleccionado?.id;
    const abonoPrestamo = this.prestamoDeduccionMonto;

    this.nominaService.crearNomina(request).subscribe({
      next: (id) => {
        if (colaboradorId && abonoPrestamo > 0) {
          this.prestamoService.abonarByColaborador(colaboradorId, abonoPrestamo).subscribe({
            next: () => {
              this.prestamoService.getDeuda(colaboradorId).subscribe({
                next: (d) => { this.deuda = d; this.cdr.detectChanges(); },
                error: () => {},
              });
            },
            error: (err) => console.error('Error al abonar al préstamo', err),
          });
        }

        this.nominaCreada.emit(id);
        this.percepciones = [];
        this.deducciones = [];
        this.prestamoDeduccionMonto = 0;
        this.percepcionesChange.emit([]);
        this.deduccionesChange.emit([]);

        if (this.laboral) {
          this.percepcionConcepto = `Pago por ${this.diasPago} días laborales`;
          this.percepcionMonto = this.laboral.sueldo;
        }
        this.periodoChange.emit({ inicio: this.fechaInicio, fin: this.fechaFin, dias: this.diasPago });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al crear nómina', err),
    });
  }
}