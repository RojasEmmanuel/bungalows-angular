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
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';

import { VacacionesService } from '../../../services/vacaciones.service';
import { EnumsService } from '../../../services/enums.service';
import {
  VacacionesPatch,
  VacacionesSimpleResponse,
} from '../../../models/vacaciones.model';
import { EnumOption } from '../../../models/enum-option.model';

@Component({
  selector: 'app-vacaciones-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vacaciones-edit.html',
  styleUrl: './vacaciones-edit.css',
})
export class VacacionesEdit implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly vacacionesService = inject(VacacionesService);
  private readonly enumsService = inject(EnumsService);

  vacacionesId = input.required<number>();

  guardado = output<void>();
  cancelado = output<void>();

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group(
    {
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      estatusVacaciones: ['', [Validators.required]],
      cantidadPagada: [null as number | null], // NUEVO CAMPO
    },
    { validators: this.rangoFechasValidator() }
  );

  // ---------- Catálogo ----------
  estatusList = signal<EnumOption[]>([]);

  // ---------- UI ----------
  cargando = signal(false);
  guardando = signal(false);
  errorGeneral = signal<string | null>(null);
  
  // NUEVO: Signal para reactividad en el HTML
  esPagada = signal(false);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.escucharCambioEstatus();
    this.cargarDatos();
  }

  private cargarDatos(): void {
    this.cargando.set(true);
    this.errorGeneral.set(null);

    forkJoin({
      estatusList: this.enumsService
        .getEstatusVacaciones()
        .pipe(catchError(() => of([] as EnumOption[]))),
      vacaciones: this.vacacionesService
        .getVacacionesById(this.vacacionesId())
        .pipe(
          catchError((err: HttpErrorResponse) => {
            console.error('Error al cargar vacaciones', err);
            this.errorGeneral.set(
              err.status === 404
                ? 'No se encontró el registro de vacaciones.'
                : 'No se pudo cargar el registro de vacaciones.'
            );
            return of(null as VacacionesSimpleResponse | null);
          })
        ),
    }).subscribe({
      next: ({ estatusList, vacaciones }) => {
        this.estatusList.set(estatusList);

        if (vacaciones) {
          const estatusNormalizado = this.normalizarEstatus(
            vacaciones.estatusVacaciones,
            estatusList
          );

          this.form.patchValue({
            fechaInicio: vacaciones.fechaInicio ?? '',
            fechaFin: vacaciones.fechaFin ?? '',
            estatusVacaciones: estatusNormalizado,
            cantidadPagada: vacaciones.cantidadPagada ?? null, // Cargamos la cantidad del backend
          });
          
          // Forzamos la validación inicial por si viene con estatus "PAGADA"
          this.actualizarValidacionCantidad(estatusNormalizado);
        }

        this.cargando.set(false);
      },
    });
  }

  // NUEVO: Reaccionar al cambio de estatus en la UI
  private escucharCambioEstatus(): void {
    this.form.controls.estatusVacaciones.valueChanges.subscribe((val) => {
      this.actualizarValidacionCantidad(val);
    });
  }

  private actualizarValidacionCantidad(estatus: string): void {
    const esPagada = estatus?.toUpperCase().includes('PAGADA');
    this.esPagada.set(esPagada);

    const cantControl = this.form.controls.cantidadPagada;
    
    if (esPagada) {
      cantControl.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      cantControl.clearValidators();
      cantControl.setValue(null); // Limpiamos el valor si se cambia a un estatus que no es pagada
    }
    cantControl.updateValueAndValidity();
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
    const esPagada = this.esPagada();

    const body: VacacionesPatch = {
      id: this.vacacionesId(),
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      estatusVacaciones: v.estatusVacaciones,
      cantidadPagada: esPagada ? v.cantidadPagada : null, // NUEVO
    };

    this.vacacionesService.actualizarVacaciones(body).subscribe({
      next: () => {
        this.guardando.set(false);
        this.guardado.emit();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar vacaciones', err);
        this.errorGeneral.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  // ---------- Validadores ----------
  private rangoFechasValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const inicio = group.get('fechaInicio')?.value;
      const fin = group.get('fechaFin')?.value;
      if (!inicio || !fin) return null;
      return fin > inicio ? null : { rangoInvalido: true };
    };
  }

  get errorRango(): boolean {
    return this.form.hasError('rangoInvalido');
  }

  // ---------- Helpers ----------
  private normalizarEstatus(
    valor: string | null | undefined,
    opciones: EnumOption[]
  ): string {
    if (!valor) return opciones[0]?.value ?? '';
    const v = valor.toLowerCase();

    const porValue = opciones.find((o) => o.value.toLowerCase() === v);
    if (porValue) return porValue.value;

    const porLabel = opciones.find((o) => o.label.toLowerCase() === v);
    if (porLabel) return porLabel.value;

    return opciones[0]?.value ?? '';
  }

  errorDe(
    campo: 'fechaInicio' | 'fechaFin' | 'estatusVacaciones' | 'cantidadPagada'
  ): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;
    
    if (control.hasError('required')) return 'Este campo es obligatorio';
    if (control.hasError('min')) return 'La cantidad debe ser mayor a 0';
    return 'Campo inválido';
  }

  private extraerMensajeError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body?.errors && typeof body.errors === 'object') {
      return (Object.values(body.errors) as string[]).join(', ');
    }
    if (body?.message) return body.message;
    if (err.status === 0) return 'Sin conexión con el servidor.';
    return 'No se pudieron actualizar las vacaciones.';
  }
}