import {
  Component,
  inject,
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
import { ColaboradorService } from '../../../services/colaborador.service';
import { EnumsService } from '../../../services/enums.service';
import { VacacionesRequest } from '../../../models/vacaciones.model';
import { ColaboradorTable } from '../../../models/colaborador.model';
import { EnumOption } from '../../../models/enum-option.model';

@Component({
  selector: 'app-vacaciones-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vacaciones-form.html',
  styleUrl: './vacaciones-form.css',
})
export class VacacionesForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly vacacionesService = inject(VacacionesService);
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly enumsService = inject(EnumsService);

  /** Emite cuando se crea correctamente */
  creado = output<void>();

  /** Emite cuando se cancela */
  cancelado = output<void>();

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group(
    {
      colaboradorId: [null as number | null, [Validators.required]],
      fechaInicio: ['', [Validators.required]],
      fechaFin: ['', [Validators.required]],
      estatus: ['', [Validators.required]],
    },
    { validators: this.rangoFechasValidator() }
  );

  // ---------- Catálogos ----------
  colaboradores = signal<ColaboradorTable[]>([]);
  estatusList = signal<EnumOption[]>([]);

  /** Texto de búsqueda del select de colaborador (filtra localmente) */
  busquedaColaborador = signal('');

  /** Colaboradores filtrados por búsqueda (máx 20 resultados) */
  colaboradoresFiltrados = signal<ColaboradorTable[]>([]);

  /** Estado del dropdown custom */
  dropdownAbierto = signal(false);

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
      colaboradores: this.colaboradorService
        .getColaboradores()
        .pipe(catchError(() => of([] as ColaboradorTable[]))),
      estatus: this.enumsService
        .getEstatusVacaciones()
        .pipe(catchError(() => of([] as EnumOption[]))),
    }).subscribe({
      next: ({ colaboradores, estatus }) => {
        this.colaboradores.set(colaboradores);
        this.estatusList.set(estatus);

        this.colaboradoresFiltrados.set(colaboradores.slice(0, 20));

        // Default del estatus: el primero del catálogo
        this.form.patchValue({
          estatus: estatus[0]?.value ?? '',
        });

        this.cargando.set(false);
      },
    });
  }

  // ---------- Dropdown custom de colaborador ----------
  onBusquedaColaborador(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.busquedaColaborador.set(term);
    this.dropdownAbierto.set(true);

    const t = term.trim().toLowerCase();
    const filtrados = !t
      ? this.colaboradores()
      : this.colaboradores().filter((c) =>
          c.nombreCompleto?.toLowerCase().includes(t)
        );

    this.colaboradoresFiltrados.set(filtrados.slice(0, 20));
  }

  seleccionarColaborador(c: ColaboradorTable): void {
    this.form.patchValue({ colaboradorId: c.id });
    this.busquedaColaborador.set(c.nombreCompleto);
    this.dropdownAbierto.set(false);
  }

  onFocusBusqueda(): void {
    this.dropdownAbierto.set(true);
  }

  onBlurBusqueda(): void {
    // Delay para permitir el click en la opción
    setTimeout(() => this.dropdownAbierto.set(false), 150);
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

    const body: VacacionesRequest = {
      colaboradorId: v.colaboradorId!,
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      estatusVacaciones: v.estatus,
    };

    this.vacacionesService.crearVacaciones(body).subscribe({
      next: () => {
        this.guardando.set(false);
        this.creado.emit();
        this.reset();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al crear vacaciones', err);
        this.errorGeneral.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  // ---------- Validadores ----------
  /**
   * Valida que fechaFin sea posterior a fechaInicio.
   * Aplica también al editar (aunque aquí solo es crear).
   */
  private rangoFechasValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const inicio = group.get('fechaInicio')?.value;
      const fin = group.get('fechaFin')?.value;
      if (!inicio || !fin) return null;

      return fin > inicio ? null : { rangoInvalido: true };
    };
  }

  /** Error general del grupo (para mostrar en el banner) */
  get errorRango(): boolean {
    return this.form.hasError('rangoInvalido');
  }

  // ---------- Helpers ----------
  private reset(): void {
    this.form.reset({
      colaboradorId: null,
      fechaInicio: '',
      fechaFin: '',
      estatus: this.estatusList()[0]?.value ?? '',
    });
    this.busquedaColaborador.set('');
    this.colaboradoresFiltrados.set(this.colaboradores().slice(0, 20));
    this.dropdownAbierto.set(false);
  }

  errorDe(
    campo: 'colaboradorId' | 'fechaInicio' | 'fechaFin' | 'estatus'
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
    return 'No se pudieron registrar las vacaciones.';
  }

  /** Fecha mínima para el input: hoy (para fechaInicio) */
  hoy(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /** Fecha mínima para el input: mañana (para fechaFin) */
  manana(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}