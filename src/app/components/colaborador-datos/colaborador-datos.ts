import {
  Component,
  inject,
  input,
  output,
  signal,
  OnInit,
  OnDestroy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, forkJoin, of } from 'rxjs';

import { ColaboradorService } from '../../services/colaborador.service';
import { EnumsService } from '../../services/enums.service';
import { UploadColaboradorService } from '../../services/upload/colaborador-upload.service';

import {
  ColaboradorPatch,
  ColaboradorResponse,
} from '../../models/colaborador.model';
import { EnumOption } from '../../models/enum-option.model';

@Component({
  selector: 'app-colaborador-datos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './colaborador-datos.html',
  styleUrl: './colaborador-datos.css',
})
export class ColaboradorDatos implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly enumsService = inject(EnumsService);
  private readonly uploadService = inject(UploadColaboradorService);

  /** ID del colaborador (obligatorio) */
  colaboradorId = input.required<number>();

  /** Emite cuando se guarda correctamente */
  guardado = output<ColaboradorResponse>();

  /** Emite cuando se cancela */
  cancelado = output<void>();

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group({
    nombre: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    ap: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    am: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    fechaNacimiento: ['', [Validators.required]],
    estadoCivil: ['', [Validators.required]],
  });

  // ---------- Catálogos ----------
  estadosCivil = signal<EnumOption[]>([]);

  // ---------- Foto ----------
  /** Archivo nuevo seleccionado (aún no subido) */
  archivo = signal<File | null>(null);
  /** Preview local del archivo nuevo */
  previewUrl = signal<string | null>(null);
  /** Path actual guardado en el backend */
  fotografiaPath = signal<string | null>(null);

  // ---------- Estados UI ----------
  cargando = signal(false);
  guardando = signal(false);
  subiendoFoto = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Computed ----------
  /** URL de la imagen a mostrar: preview local si hay archivo nuevo, sino el actual del backend */
  imagenActual = computed(() => this.previewUrl() ?? this.fotografiaPath());

  /** Nombre del archivo nuevo */
  nombreArchivo = computed(() => this.archivo()?.name ?? '');

  /** ¿Hay archivo nuevo pendiente de subir? */
  hayArchivoNuevo = computed(() => this.archivo() !== null);

  /** ¿El colaborador tiene foto? */
  tieneFoto = computed(() => !!this.imagenActual());

  /** Iniciales para el avatar de fallback */
  iniciales = computed(() => {
    const v = this.form.getRawValue();
    const nombre = (v.nombre ?? '').trim();
    const ap = (v.ap ?? '').trim();
    if (!nombre && !ap) return '?';
    if (!nombre) return ap.substring(0, 2).toUpperCase();
    if (!ap) return nombre.substring(0, 2).toUpperCase();
    return (nombre[0] + ap[0]).toUpperCase();
  });

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
  }

  private cargarDatos(): void {
    this.cargando.set(true);
    this.errorGeneral.set(null);

    forkJoin({
      estadosCivil: this.enumsService
        .getEstadosCivil()
        .pipe(catchError(() => of([] as EnumOption[]))),
      colaborador: this.colaboradorService
        .getColaboradorSimpleById(this.colaboradorId())
        .pipe(
          catchError((err: HttpErrorResponse) => {
            console.error('Error al cargar colaborador', err);
            this.errorGeneral.set(
              err.status === 404
                ? 'No se encontró el colaborador.'
                : 'No se pudo cargar la información del colaborador.'
            );
            return of(null);
          })
        ),
    }).subscribe({
      next: ({ estadosCivil, colaborador }) => {
        this.estadosCivil.set(estadosCivil);

        if (colaborador) {
          this.form.patchValue({
            nombre: colaborador.nombre ?? '',
            ap: colaborador.ap ?? '',
            am: colaborador.am ?? '',
            fechaNacimiento: colaborador.fechaNacimiento ?? '',
            estadoCivil: this.normalizarEstadoCivil(
              colaborador.estadoCivil,
              estadosCivil
            ),
          });
          this.fotografiaPath.set(colaborador.fotografia ?? null);
        } else {
          this.form.patchValue({
            estadoCivil: estadosCivil[0]?.value ?? '',
          });
        }

        this.cargando.set(false);
      },
    });
  }

  // ---------- Foto ----------
  onFotoSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const tiposOk = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposOk.includes(file.type)) {
      this.errorGeneral.set('Formato no permitido. Usa JPG, PNG o WEBP.');
      input.value = '';
      return;
    }
    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      this.errorGeneral.set(`La foto no debe pesar más de ${maxMB} MB.`);
      input.value = '';
      return;
    }

    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);

    this.errorGeneral.set(null);
    this.archivo.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  quitarFotoNueva(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.archivo.set(null);
    this.previewUrl.set(null);
  }

  onImageError(): void {
    // Si la imagen falla, mostramos avatar de iniciales
    this.fotografiaPath.set(null);
    this.previewUrl.set(null);
  }

  // ---------- Envío ----------
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorGeneral.set(null);

    // Si hay archivo nuevo, súbelo primero
    if (this.archivo()) {
      this.subirFotoYGuardar();
    } else {
      this.guardar();
    }
  }

  private subirFotoYGuardar(): void {
    this.subiendoFoto.set(true);

    this.uploadService.subirFoto(this.archivo()!).subscribe({
      next: (res) => {
        this.fotografiaPath.set(res.path);
        this.subiendoFoto.set(false);
        this.guardar();
      },
      error: (err) => {
        console.error('Error al subir foto', err);
        this.errorGeneral.set('No se pudo subir la foto. Intenta de nuevo.');
        this.subiendoFoto.set(false);
      },
    });
  }

  private guardar(): void {
    this.guardando.set(true);
    const v = this.form.getRawValue();

    const body: ColaboradorPatch = {
      id: this.colaboradorId(),
      nombre: v.nombre.trim(),
      ap: v.ap.trim(),
      am: v.am.trim(),
      fechaNacimiento: v.fechaNacimiento,
      estadoCivil: v.estadoCivil,
      fotografia: this.fotografiaPath(),
    };

    this.colaboradorService.actualizarColaborador(body).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar colaborador', err);
        this.errorGeneral.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  // ---------- Normalización de enum ----------
  private normalizarEstadoCivil(
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

  // ---------- Errores ----------
  errorDe(campo: 'nombre' | 'ap' | 'am' | 'fechaNacimiento' | 'estadoCivil'): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) return 'Este campo es obligatorio';
    if (control.hasError('minlength')) {
      return `Mínimo ${control.getError('minlength').requiredLength} caracteres`;
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
    return 'No se pudieron actualizar los datos del colaborador.';
  }
}