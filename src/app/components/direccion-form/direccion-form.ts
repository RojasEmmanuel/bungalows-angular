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
import { forkJoin } from 'rxjs';

import { DireccionService } from '../../services/direccion.service';
import { EnumsService } from '../../services/enums.service';
import { DireccionPatch, DireccionResponse } from '../../models/direccion.model';
import { EnumOption } from '../../models/enum-option.model';

@Component({
  selector: 'app-direccion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './direccion-form.html',
  styleUrl: './direccion-form.css',
})
export class DireccionForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly direccionService = inject(DireccionService);
  private readonly enumsService = inject(EnumsService);

  colaboradorId = input.required<number>();

  guardado = output<DireccionResponse>();
  cancelado = output<void>();

  form = this.fb.nonNullable.group({
    calle: ['', [Validators.required, Validators.maxLength(100)]],
    colonia: ['', [Validators.required, Validators.maxLength(100)]],
    ciudad: ['', [Validators.required, Validators.maxLength(50)]],
    estado: ['', [Validators.required]],
    cp: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
  });

  // ---------- Catálogos ----------
  estados = signal<EnumOption[]>([]);

  // ---------- Estados de UI ----------
  cargando = signal(false);
  guardando = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Carga en paralelo:
   *  - la lista de estados (catálogo)
   *  - la dirección actual del colaborador
   */
  private cargarDatos(): void {
    this.cargando.set(true);
    this.errorGeneral.set(null);

    forkJoin({
      estados: this.enumsService.getEstados(),
      direccion: this.direccionService.getDireccion(this.colaboradorId()),
    }).subscribe({
      next: ({ estados, direccion }) => {
        this.estados.set(estados);

        this.form.patchValue({
          calle: direccion?.calle ?? '',
          colonia: direccion?.colonia ?? '',
          ciudad: direccion?.ciudad ?? '',
          estado: this.normalizarEstado(direccion?.estado, estados),
          cp: direccion?.cp ?? '',
        });

        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar datos de dirección', err);
        // Si falla el GET de dirección (404), aún queremos mostrar los estados
        this.enumsService.getEstados().subscribe({
          next: (estados) => {
            this.estados.set(estados);
            this.form.patchValue({
              estado: estados[0]?.value ?? '',
            });
            if (err.status === 404) {
              this.errorGeneral.set(
                'Este colaborador aún no tiene una dirección registrada.'
              );
            } else {
              this.errorGeneral.set('No se pudo cargar la dirección actual.');
            }
            this.cargando.set(false);
          },
          error: () => {
            this.errorGeneral.set('No se pudieron cargar los estados.');
            this.cargando.set(false);
          },
        });
      },
    });
  }

  /**
   * Normaliza el valor del estado para que coincida con un `value` del catálogo.
   * Acepta tanto "JALISCO" como "Jalisco" y devuelve "JALISCO".
   */
  private normalizarEstado(
    valor: string | null | undefined,
    opciones: EnumOption[]
  ): string {
    if (!valor) return opciones[0]?.value ?? '';

    // Match exacto por value
    const porValue = opciones.find((o) => o.value === valor);
    if (porValue) return porValue.value;

    // Match por label (case-insensitive)
    const porLabel = opciones.find(
      (o) => o.label.toLowerCase() === valor.toLowerCase()
    );
    if (porLabel) return porLabel.value;

    // Fallback: primera opción
    return opciones[0]?.value ?? '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);

    const v = this.form.getRawValue();

    const body: DireccionPatch = {
      colaboradorId: this.colaboradorId(),
      calle: v.calle.trim(),
      colonia: v.colonia.trim(),
      ciudad: v.ciudad.trim(),
      estado: v.estado,
      cp: v.cp.trim(),
    };

    this.direccionService.actualizarDireccion(body).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar dirección', err);
        this.errorGeneral.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  errorDe(campo: 'calle' | 'colonia' | 'ciudad' | 'cp'): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) return 'Este campo es obligatorio';
    if (control.hasError('maxlength')) {
      const req = control.getError('maxlength').requiredLength;
      return `Máximo ${req} caracteres`;
    }
    if (control.hasError('pattern')) {
      return 'Debe ser un código postal de 5 dígitos';
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
    return 'No se pudo actualizar la dirección.';
  }
}