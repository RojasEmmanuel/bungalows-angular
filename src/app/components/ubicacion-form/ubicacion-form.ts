import {
  Component,
  computed,
  inject,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { UbicacionService } from '../../services/ubicacion.service';
import { UploadUbicacionService } from '../../services/upload/ubicacion-upload.service';
import { UbicacionResponse } from '../../models/ubicacion.model';

@Component({
  selector: 'app-ubicacion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ubicacion-form.html',
  styleUrl: './ubicacion-form.css',
})
export class UbicacionFormComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly ubicacionService = inject(UbicacionService);
  private readonly uploadService = inject(UploadUbicacionService);

  /** Emite cuando se crea la ubicación */
  creada = output<UbicacionResponse>();
  /** Emite cuando el usuario cancela */
  cancelada = output<void>();

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group({
    nombre: [
      '',  // ← valor inicial (falta)
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
      ],
    ],
    direccion: ['', [Validators.required]],
  });

  // ---------- Estado de la imagen ----------
  archivo = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  imagenPath = signal<string | null>(null);

  // ---------- Estados de UI ----------
  subiendoImagen = signal(false);
  guardando = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Computed ----------
  hayArchivo = computed(() => this.archivo() !== null);
  nombreArchivo = computed(() => this.archivo()?.name ?? '');
  enviando = computed(() => this.subiendoImagen() || this.guardando());

  // ---------- Imagen ----------
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validaciones cliente (el backend valida igual)
    const tiposOk = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposOk.includes(file.type)) {
      this.errorGeneral.set('Formato no permitido. Usa JPG, PNG o WEBP.');
      input.value = '';
      return;
    }
    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      this.errorGeneral.set(`La imagen no debe pesar más de ${maxMB} MB.`);
      input.value = '';
      return;
    }

    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);

    this.errorGeneral.set(null);
    this.archivo.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  quitarArchivo(): void {
    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);
    this.archivo.set(null);
    this.previewUrl.set(null);
    this.imagenPath.set(null);
  }

  // ---------- Envío ----------
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorGeneral.set(null);

    // 1) Si hay archivo, súbelo primero
    if (this.archivo()) {
      this.subirImagenYCrear();
    } else {
      this.crearUbicacion();
    }
  }

  private subirImagenYCrear(): void {
    this.subiendoImagen.set(true);

    this.uploadService.subirImagen(this.archivo()!).subscribe({
      next: (res) => {
        this.imagenPath.set(res.path);
        this.subiendoImagen.set(false);
        this.crearUbicacion();
      },
      error: (err) => {
        console.error('Error al subir imagen', err);
        this.errorGeneral.set('No se pudo subir la imagen. Intenta de nuevo.');
        this.subiendoImagen.set(false);
      },
    });
  }

  private crearUbicacion(): void {
    this.guardando.set(true);

    const body = {
      nombre: this.form.getRawValue().nombre,
      direccion: this.form.getRawValue().direccion,
      imagenPath: this.imagenPath(),
    };

    this.ubicacionService.crearUbicacion(body).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.creada.emit(res);
        this.reset();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al crear ubicación', err);
        this.errorGeneral.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  cancelar(): void {
    this.cancelada.emit();
  }

  // ---------- Helpers ----------
  private reset(): void {
    this.form.reset({ nombre: '', direccion: '' });
    this.quitarArchivo();
    this.imagenPath.set(null);
  }

  /** Extrae el mensaje de error del backend (Bean Validation) */
  private extraerMensajeError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body?.errors && typeof body.errors === 'object') {
      const mensajes = Object.values(body.errors) as string[];
      return mensajes.join(', ');
    }
    if (body?.message) return body.message;
    if (err.status === 0) return 'Sin conexión con el servidor.';
    return 'No se pudo crear la ubicación. Intenta de nuevo.';
  }

  /** Mensaje de error por campo, para el template */
  mostrarError(campo: 'nombre' | 'direccion'): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) {
      return campo === 'nombre'
        ? 'Debe ingresar un nombre'
        : 'Debe ingresar una dirección';
    }
    if (control.hasError('minlength')) {
      return 'El nombre debe tener mínimo 3 caracteres';
    }
    if (control.hasError('maxlength')) {
      return 'El nombre debe tener máximo 50 caracteres';
    }
    return null;
  }

  ngOnDestroy(): void {
    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);
  }
}