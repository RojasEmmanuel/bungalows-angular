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
import { catchError, of } from 'rxjs';

import { ConfidencialService } from '../../services/confidencial.service';
import {
  ConfidencialPatch,
  ConfidencialResponse,
} from '../../models/confidencial.model';

@Component({
  selector: 'app-confidencial-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './confidencial-form.html',
  styleUrl: './confidencial-form.css',
})
export class ConfidencialForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly confidencialService = inject(ConfidencialService);

  /** ID del colaborador (obligatorio) */
  colaboradorId = input.required<number>();

  /** Emite cuando se guarda correctamente */
  guardado = output<ConfidencialResponse>();

  /** Emite cuando se cancela */
  cancelado = output<void>();

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group({
    curp: [
      '',
      [
        Validators.required,
        Validators.minLength(18),
        Validators.maxLength(18),
        Validators.pattern(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/),
      ],
    ],
    rfc: [
      '',
      [
        Validators.required,
        Validators.minLength(13),
        Validators.maxLength(13),
        Validators.pattern(/^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/),
      ],
    ],
    nss: [
      '',
      [
        Validators.required,
        Validators.minLength(11),
        Validators.maxLength(11),
        Validators.pattern(/^\d{11}$/),
      ],
    ],
  });

  // ---------- Estados de UI ----------
  cargando = signal(false);
  guardando = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarConfidencial();
  }

  private cargarConfidencial(): void {
    this.cargando.set(true);
    this.errorGeneral.set(null);

    this.confidencialService
      .getByColaboradorId(this.colaboradorId())
      .pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            this.errorGeneral.set(
              'Este colaborador aún no tiene datos confidenciales registrados.'
            );
          } else {
            console.error('Error al cargar datos confidenciales', err);
            this.errorGeneral.set(
              'No se pudieron cargar los datos confidenciales.'
            );
          }
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          this.form.patchValue({
            curp: (data.curp ?? '').toUpperCase(),
            rfc: (data.rfc ?? '').toUpperCase(),
            nss: data.nss ?? '',
          });
        }
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

    const body: ConfidencialPatch = {
      colaboradorId: this.colaboradorId(),
      curp: v.curp.trim().toUpperCase(),
      rfc: v.rfc.trim().toUpperCase(),
      nss: v.nss.trim(),
    };

    this.confidencialService.actualizarConfidencial(body).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar datos confidenciales', err);
        this.errorGeneral.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  // ---------- Errores por campo ----------
  errorDe(campo: 'curp' | 'rfc' | 'nss'): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) return 'Este campo es obligatorio';

    if (control.hasError('minlength') || control.hasError('maxlength')) {
      if (campo === 'curp') return 'La CURP debe tener exactamente 18 caracteres';
      if (campo === 'rfc') return 'El RFC debe tener exactamente 13 caracteres';
      if (campo === 'nss') return 'El NSS debe tener exactamente 11 dígitos';
    }

    if (control.hasError('pattern')) {
      if (campo === 'curp') return 'Formato de CURP inválido';
      if (campo === 'rfc') return 'Formato de RFC inválido';
      if (campo === 'nss') return 'El NSS debe contener solo 11 dígitos';
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
    return 'No se pudieron actualizar los datos confidenciales.';
  }
}