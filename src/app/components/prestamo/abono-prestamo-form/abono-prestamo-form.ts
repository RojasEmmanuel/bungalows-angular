import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { toast } from 'ngx-sonner';

import { PrestamoService } from '../../../services/prestamo.service';

@Component({
  selector: 'app-abono-prestamo-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './abono-prestamo-form.html',
  styleUrl: './abono-prestamo-form.css',
})
export class AbonoPrestamoForm {
  private readonly fb = inject(FormBuilder);
  private readonly prestamoService = inject(PrestamoService);

  /** ID del préstamo (obligatorio) */
  prestamoId = input.required<number>();

  /** Saldo pendiente del préstamo */
  pendiente = input<number>(0);

  /** Emite el monto abonado cuando se aplica correctamente */
  abonado = output<number>();

  /** Emite cuando el usuario cancela */
  cancelado = output<void>();

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group({
    monto: [0, [Validators.required, Validators.min(1)]],
  });

  // ---------- UI ----------
  guardando = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Computed ----------
  pendienteFormateado = computed(() => this.formatoMonto(this.pendiente()));

  opcionesRapidas = computed(() => {
    const p = this.pendiente();
    if (p <= 0) return [];
    return [
      { label: '25%', valor: Math.round(p * 0.25 * 100) / 100 },
      { label: '50%', valor: Math.round(p * 0.5 * 100) / 100 },
      { label: '100%', valor: p },
    ];
  });

  setMonto(valor: number): void {
    this.form.patchValue({ monto: valor });
    this.form.get('monto')?.markAsTouched();
  }

  // ---------- Envío ----------
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const monto = this.form.getRawValue().monto;

    // Validación de negocio: no abonar más de lo que se debe
    if (monto > this.pendiente()) {
      const mensaje = `El abono no puede ser mayor al saldo pendiente (${this.pendienteFormateado()}).`;
      this.errorGeneral.set(mensaje);

      toast.warning('Monto inválido', {
        description: mensaje,
      });
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);

    this.prestamoService.abonarPrestamo(this.prestamoId(), monto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.abonado.emit(monto);

        toast.success('Abono aplicado', {
          description: `${this.formatoMonto(monto)} abonados correctamente.`,
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al aplicar abono', err);
        const mensaje = this.extraerMensajeError(err);
        this.errorGeneral.set(mensaje);
        this.guardando.set(false);

        toast.error('No se pudo aplicar el abono', {
          description: mensaje,
        });
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  errorDe(campo: 'monto'): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) return 'Ingresa el monto del abono';
    if (control.hasError('min')) {
      return `El monto mínimo es ${control.getError('min').min}`;
    }
    return 'Campo inválido';
  }

  // ---------- Helpers ----------
  private formatoMonto(valor: number | null | undefined): string {
    if (valor == null) return '—';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 2,
    }).format(valor);
  }

  private extraerMensajeError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body?.errors && typeof body.errors === 'object') {
      return (Object.values(body.errors) as string[]).join(', ');
    }
    if (body?.message) return body.message;
    if (err.status === 0) return 'Sin conexión con el servidor.';
    return 'No se pudo aplicar el abono.';
  }
}