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

import { PrestamoService } from '../../../services/prestamo.service';
import { EnumsService } from '../../../services/enums.service';
import {
  PrestamoPatch,
  PrestamoResponse,
} from '../../../models/prestamo.model';
import { EnumOption } from '../../../models/enum-option.model';

@Component({
  selector: 'app-prestamos-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './prestamos-edit.html',
  styleUrl: '../prestamos-form/prestamos-form.css',
})
export class PrestamosEdit implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly prestamoService = inject(PrestamoService);
  private readonly enumsService = inject(EnumsService);

  /** ID del préstamo (obligatorio) */
  prestamoId = input.required<number>();

  guardado = output<PrestamoResponse>();
  cancelado = output<void>();

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group({
    monto: [0, [Validators.required, Validators.min(100)]],
    fechaPrestamo: ['', [Validators.required]],
    estatus: ['', [Validators.required]],
    observaciones: ['', [Validators.maxLength(300)]],
  });

  // ---------- Catálogo de estatus ----------
  estatusList = signal<EnumOption[]>([]);

  // ---------- Estado de UI ----------
  cargando = signal(false);
  guardando = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Carga en paralelo:
   *  - catálogo de estatus
   *  - datos del préstamo actual
   */
  private cargarDatos(): void {
    this.cargando.set(true);
    this.errorGeneral.set(null);

    forkJoin({
      estatusList: this.enumsService
        .getEstatusPrestamo()
        .pipe(catchError(() => of([] as EnumOption[]))),
      prestamo: this.prestamoService
        .getPrestamoById(this.prestamoId())
        .pipe(
          catchError((err: HttpErrorResponse) => {
            console.error('Error al cargar préstamo', err);
            this.errorGeneral.set(
              err.status === 404
                ? 'No se encontró el préstamo.'
                : 'No se pudo cargar el préstamo.'
            );
            return of(null);
          })
        ),
    }).subscribe({
      next: ({ estatusList, prestamo }) => {
        this.estatusList.set(estatusList);

        if (prestamo) {
          this.form.patchValue({
            monto: prestamo.monto ?? 0,
            fechaPrestamo: prestamo.fechaPrestamo ?? '',
            estatus: this.normalizarEstatus(prestamo.estatus, estatusList),
            observaciones: prestamo.observaciones ?? '',
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

    const body: PrestamoPatch = {
      id: this.prestamoId(),
      monto: v.monto,
      fechaPrestamo: v.fechaPrestamo,
      estatus: v.estatus,
      observaciones: v.observaciones.trim(),
    };

    this.prestamoService.actualizarPrestamo(body).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar préstamo', err);
        this.errorGeneral.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  // ---------- Helpers ----------
  /**
   * Normaliza el estatus del backend para que coincida con un value del catálogo.
   * Acepta "PAGADO" o "Pagado" y devuelve "PAGADO".
   */
  private normalizarEstatus(
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

  errorDe(
    campo: 'monto' | 'fechaPrestamo' | 'estatus' | 'observaciones'
  ): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) return 'Este campo es obligatorio';
    if (control.hasError('min')) {
      return `El monto mínimo es ${control.getError('min').min}`;
    }
    if (control.hasError('maxlength')) {
      return `Máximo ${control.getError('maxlength').requiredLength} caracteres`;
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
    return 'No se pudo actualizar el préstamo.';
  }
}