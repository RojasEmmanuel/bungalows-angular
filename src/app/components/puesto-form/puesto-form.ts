import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { PuestoService } from '../../services/puesto.service';
import { PuestoRequest, PuestoResponse } from '../../models/puesto.model';

@Component({
  selector: 'app-puesto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './puesto-form.html',
  styleUrl: './puesto-form.css',
})
export class PuestoForm {
  private readonly fb = inject(FormBuilder);
  private readonly puestoService = inject(PuestoService);

  creado = output<PuestoResponse>();
  cancelado = output<void>();

  form = this.fb.nonNullable.group({
    nombre: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    descripcion: ['', [Validators.required]],
  });

  guardando = signal(false);
  errorGeneral = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);

    const body: PuestoRequest = {
      nombre: this.form.getRawValue().nombre.trim(),
      descripcion: this.form.getRawValue().descripcion.trim(),
    };

    this.puestoService.crearPuesto(body).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.creado.emit(res);
        this.form.reset({ nombre: '', descripcion: '' });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al crear puesto', err);
        this.errorGeneral.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  errorDe(campo: 'nombre' | 'descripcion'): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) {
      return campo === 'nombre'
        ? 'Debe ingresar un nombre'
        : 'Debe ingresar una descripción';
    }
    if (control.hasError('minlength')) {
      return 'El nombre debe tener mínimo 3 caracteres';
    }
    if (control.hasError('maxlength')) {
      return 'El nombre debe tener máximo 100 caracteres';
    }
    return null;
  }

  private extraerMensajeError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body?.errors && typeof body.errors === 'object') {
      return (Object.values(body.errors) as string[]).join(', ');
    }
    if (body?.message) return body.message;
    if (err.status === 0) return 'Sin conexión con el servidor.';
    return 'No se pudo crear el puesto. Intenta de nuevo.';
  }
}