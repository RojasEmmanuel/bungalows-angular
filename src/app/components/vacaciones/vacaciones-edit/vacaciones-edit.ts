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

  /** ID de las vacaciones (obligatorio) */
  vacacionesId = input.required<number>();

  guardado = output<void>();
  cancelado = output<void>();

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group(
    {
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      estatusVacaciones: ['', [Validators.required]],
    },
    { validators: this.rangoFechasValidator() }
  );

  // ---------- Catálogo de estatus ----------
  estatusList = signal<EnumOption[]>([]);

  // ---------- UI ----------
  cargando = signal(false);
  guardando = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
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
          this.form.patchValue({
            fechaInicio: vacaciones.fechaInicio ?? '',
            fechaFin: vacaciones.fechaFin ?? '',
            estatusVacaciones: this.normalizarEstatus(
              vacaciones.estatusVacaciones,
              estatusList
            ),
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

    const body: VacacionesPatch = {
      id: this.vacacionesId(),
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      estatusVacaciones: v.estatusVacaciones,
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
    campo: 'fechaInicio' | 'fechaFin' | 'estatusVacaciones'
  ): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio';
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