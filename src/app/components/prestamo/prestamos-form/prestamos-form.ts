import { Component, inject, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { PrestamoService } from '../../../services/prestamo.service';
import { ColaboradorService } from '../../../services/colaborador.service';

import { PrestamoRequest, PrestamoResponse } from '../../../models/prestamo.model';
import { ColaboradorTable } from '../../../models/colaborador.model';

@Component({
  selector: 'app-prestamos-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './prestamos-form.html',
  styleUrl: './prestamos-form.css',
})
export class PrestamosForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly prestamoService = inject(PrestamoService);
  private readonly colaboradorService = inject(ColaboradorService);

  /** Emite cuando se crea el préstamo */
  creado = output<PrestamoResponse>();

  /** Emite cuando se cancela */
  cancelado = output<void>();

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group({
    colaboradorId: [null as number | null, [Validators.required]],
    concepto: [
      '',
      [Validators.required, Validators.maxLength(150)],
    ],
    monto: [0, [Validators.required, Validators.min(100)]],
    fechaPrestamo: [this.hoy(), [Validators.required]],
    observaciones: ['', [Validators.maxLength(300)]],
  });

  // ---------- Catálogos ----------
  colaboradores = signal<ColaboradorTable[]>([]);

  // ---------- Estado UI ----------
  cargando = signal(false);
  guardando = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarColaboradores();
  }

  private cargarColaboradores(): void {
    this.cargando.set(true);
    this.errorGeneral.set(null);

    this.colaboradorService
      .getColaboradores()
      .pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('Error al cargar colaboradores', err);
          this.errorGeneral.set('No se pudieron cargar los colaboradores.');
          return of([]);
        })
      )
      .subscribe((data) => {
        this.colaboradores.set(data);
        this.cargando.set(false);
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

    const body: PrestamoRequest = {
      monto: v.monto,
      concepto: v.concepto.trim(),
      fechaPrestamo: v.fechaPrestamo,
      observaciones: v.observaciones.trim(),
      colaboradorId: v.colaboradorId!,
    };

    this.prestamoService.crearPrestamo(body).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.creado.emit(res);
        this.reset();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al crear préstamo', err);
        this.errorGeneral.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  // ---------- Helpers ----------
  private hoy(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private reset(): void {
    this.form.reset({
      colaboradorId: null,
      concepto: '',
      monto: 0,
      fechaPrestamo: this.hoy(),
      observaciones: '',
    });
  }

  errorDe(
    campo: 'colaboradorId' | 'concepto' | 'monto' | 'fechaPrestamo' | 'observaciones'
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
    return 'No se pudo crear el préstamo.';
  }
}