import {
  Component,
  inject,
  input,
  output,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';

import { LaboralService } from '../../services/laboral.service';
import { PuestoService } from '../../services/puesto.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { EnumsService } from '../../services/enums.service';

import {
  LaboralPatch,
  LaboralResponse,
} from '../../models/laboral.model';
import { PuestoResponse } from '../../models/puesto.model';
import { UbicacionResponse } from '../../models/ubicacion.model';
import { EnumOption } from '../../models/enum-option.model';

@Component({
  selector: 'app-laboral-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './laboral-form.html',
  styleUrl: './laboral-form.css',
})
export class LaboralForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly laboralService = inject(LaboralService);
  private readonly puestoService = inject(PuestoService);
  private readonly ubicacionService = inject(UbicacionService);
  private readonly enumsService = inject(EnumsService);

  /** ID del colaborador (obligatorio) */
  colaboradorId = input.required<number>();

  /** Emite cuando se guarda correctamente */
  guardado = output<LaboralResponse>();

  /** Emite cuando se cancela */
  cancelado = output<void>();

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group({
    fechaIngreso: ['', [Validators.required]],
    sueldo: [0, [Validators.required, Validators.min(1000)]],
    turno: ['', [Validators.required]],
    diaDescanso: ['', [Validators.required]],
    entrada: ['08:00', [Validators.required]],
    salida: ['17:00', [Validators.required]],
    estatus: ['', [Validators.required]],
    idPuesto: [null as number | null, [Validators.required]],
    idUbicacion: [null as number | null, [Validators.required]],
  });

  // ---------- Catálogos ----------
  puestos = signal<PuestoResponse[]>([]);
  ubicaciones = signal<UbicacionResponse[]>([]);
  turnos = signal<EnumOption[]>([]);
  diasLaborales = signal<EnumOption[]>([]);
  estatusList = signal<EnumOption[]>([]);

  // ---------- Estados UI ----------
  cargando = signal(false);
  guardando = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Carga en paralelo:
   *  - catálogos (puestos, ubicaciones, enums)
   *  - datos laborales actuales del colaborador
   */
  private cargarDatos(): void {
    this.cargando.set(true);
    this.errorGeneral.set(null);

    forkJoin({
      puestos: this.puestoService.getPuestos().pipe(catchError(() => of([]))),
      ubicaciones: this.ubicacionService.getUbicaciones().pipe(catchError(() => of([]))),
      turnos: this.enumsService.getTurnos().pipe(catchError(() => of([]))),
      diasLaborales: this.enumsService.getDiasLaborales().pipe(catchError(() => of([]))),
      estatusList: this.enumsService.getEstatusColaborador().pipe(catchError(() => of([]))),
      laboral: this.laboralService.getLaboralByColaboradorId(this.colaboradorId()).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            this.errorGeneral.set(
              'Este colaborador aún no tiene datos laborales registrados.'
            );
          } else {
            console.error('Error al cargar datos laborales', err);
            this.errorGeneral.set('No se pudieron cargar los datos laborales.');
          }
          return of(null);
        })
      ),
    }).subscribe({
      next: (res) => {
        this.puestos.set(res.puestos);
        this.ubicaciones.set(res.ubicaciones);
        this.turnos.set(res.turnos);
        this.diasLaborales.set(res.diasLaborales);
        this.estatusList.set(res.estatusList);

        if (res.laboral) {
          this.form.patchValue({
            fechaIngreso: res.laboral.fechaIngreso ?? '',
            sueldo: res.laboral.sueldo ?? 0,
            turno: this.normalizarEnum(res.laboral.turno, res.turnos),
            diaDescanso: this.normalizarEnum(res.laboral.diaDescanso, res.diasLaborales),
            entrada: this.normalizarHora(res.laboral.entrada) ?? '08:00',
            salida: this.normalizarHora(res.laboral.salida) ?? '17:00',
            estatus: this.normalizarEnum(res.laboral.estatus, res.estatusList),
            idPuesto: this.buscarPuestoPorNombre(res.laboral.puesto, res.puestos),
            idUbicacion: this.buscarUbicacionPorNombre(res.laboral.ubicacion, res.ubicaciones),
          });
        } else {
          // Defaults si no hay datos previos
          this.form.patchValue({
            turno: res.turnos[0]?.value ?? '',
            diaDescanso: res.diasLaborales[0]?.value ?? '',
            estatus: res.estatusList[0]?.value ?? '',
          });
        }

        this.cargando.set(false);
      },
    });
  }

  // ---------- Envío ----------
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);

    const v = this.form.getRawValue();

    const body: LaboralPatch = {
      colaboradorId: this.colaboradorId(),
      fechaIngreso: v.fechaIngreso,
      sueldo: v.sueldo,
      turno: v.turno,
      diaDescanso: v.diaDescanso,
      entrada: this.normalizarHoraSalida(v.entrada),
      salida: this.normalizarHoraSalida(v.salida),
      estatus: v.estatus,
      idPuesto: v.idPuesto!,
      idUbicacion: v.idUbicacion!,
    };

    this.laboralService.actualizarLaboral(body).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar datos laborales', err);
        this.errorGeneral.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  // ---------- Helpers de normalización ----------
  /**
   * Acepta "JALISCO" o "Jalisco" y devuelve el value del catálogo.
   */
  private normalizarEnum(
    valor: string | null | undefined,
    opciones: EnumOption[]
  ): string {
    if (!valor) return opciones[0]?.value ?? '';

    const porValue = opciones.find((o) => o.value === valor);
    if (porValue) return porValue.value;

    const porLabel = opciones.find(
      (o) => o.label.toLowerCase() === valor.toLowerCase()
    );
    if (porLabel) return porLabel.value;

    return opciones[0]?.value ?? '';
  }

  /**
   * "08:30:00" → "08:30" (para input type="time")
   */
  private normalizarHora(hora: string | null | undefined): string {
    if (!hora) return '';
    return hora.length >= 5 ? hora.slice(0, 5) : hora;
  }

  /**
   * "08:30" → "08:30:00" (para LocalTime del backend)
   */
  private normalizarHoraSalida(hora: string): string {
    if (!hora) return '';
    return hora.length === 5 ? `${hora}:00` : hora;
  }

  /**
   * El backend devuelve el nombre del puesto; hay que encontrar su id en el catálogo.
   */
  private buscarPuestoPorNombre(
    nombre: string | null | undefined,
    puestos: PuestoResponse[]
  ): number | null {
    if (!nombre) return null;
    const match = puestos.find((p) => p.nombre === nombre);
    return match?.id ?? null;
  }

  private buscarUbicacionPorNombre(
    nombre: string | null | undefined,
    ubicaciones: UbicacionResponse[]
  ): number | null {
    if (!nombre) return null;
    const match = ubicaciones.find((u) => u.nombre === nombre);
    return match?.id ?? null;
  }

  // ---------- Errores ----------
  errorDe(campo: string): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) return 'Este campo es obligatorio';
    if (control.hasError('min')) {
      return `El valor mínimo es ${control.getError('min').min}`;
    }
    return 'Campo inválido';
  }

  private extraerMensajeError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body?.errors && typeof body.errors === 'object') {
      return (Object.values(body.errors) as string[]).join(', ');
    }
    if (body?.message) return body.message;
    if (err.status === 0) return 'Sin conexión con el servidor.';
    return 'No se pudieron actualizar los datos laborales.';
  }
}