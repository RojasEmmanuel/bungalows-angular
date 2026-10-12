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
import { toast } from 'ngx-sonner';

import { UbicacionService } from '../../services/ubicacion.service';
import { UploadUbicacionService } from '../../services/upload/ubicacion-upload.service';
import { empresaService } from '../../services/empresa.service'; // Ajusta la ruta
import { empresaResponse } from '../../models/empresa.model'; // Ajusta la ruta
import {
  UbicacionPatch as UbicacionPatchModel,
  UbicacionResponse,
} from '../../models/ubicacion.model';

@Component({
  selector: 'app-ubicacion-patch',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ubicacion-patch.html',
  styleUrl: './ubicacion-patch.css',
})
export class UbicacionPatch implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly ubicacionService = inject(UbicacionService);
  private readonly uploadService = inject(UploadUbicacionService);
  private readonly empresaService = inject(empresaService);

  /** ID de la ubicación (obligatorio) */
  ubicacionId = input.required<number>();

  guardado = output<UbicacionResponse>();
  cancelado = output<void>();

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group({
    nombre: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(50)],
    ],
    direccion: ['', [Validators.required]],
    empresaId: [null as number | null, [Validators.required]],
  });

  // ---------- Imagen ----------
  archivo = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  imagenPath = signal<string | null>(null);

  // ---------- Empresas ----------
  empresas = signal<empresaResponse[]>([]);
  cargandoEmpresas = signal(false);

  // ---------- UI ----------
  cargando = signal(false);
  guardando = signal(false);
  subiendoImagen = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Computed ----------
  imagenActual = computed(() => this.previewUrl() ?? this.imagenPath());
  hayImagen = computed(() => !!this.imagenActual());
  hayArchivoNuevo = computed(() => this.archivo() !== null);
  nombreArchivo = computed(() => this.archivo()?.name ?? '');

  iniciales = computed(() => {
    const nombre = this.form.getRawValue().nombre?.trim() ?? '';
    if (!nombre) return '?';
    const partes = nombre.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
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
    this.cargandoEmpresas.set(true);

    forkJoin({
      ubicacion: this.ubicacionService.getUbicacionById(this.ubicacionId()).pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('Error al cargar ubicación', err);
          const mensaje =
            err.status === 404
              ? 'No se encontró la ubicación.'
              : 'No se pudo cargar la información de la ubicación.';
          this.errorGeneral.set(mensaje);
          toast.error('Error al cargar ubicación', { description: mensaje });
          return of(null);
        })
      ),
      empresas: this.empresaService.getEmpresas().pipe(
        catchError((err: HttpErrorResponse) => {
          console.error('Error al cargar empresas', err);
          toast.error('Error al cargar empresas', {
            description: 'No se pudieron cargar las empresas.',
          });
          return of([] as empresaResponse[]);
        })
      ),
    }).subscribe(({ ubicacion, empresas }) => {
      this.empresas.set(empresas);
      this.cargandoEmpresas.set(false);

      if (ubicacion) {
        this.form.patchValue({
          nombre: ubicacion.nombre ?? '',
          direccion: ubicacion.direccion ?? '',
          empresaId: ubicacion.empresaId ?? null,
        });
        this.imagenPath.set(ubicacion.imagenPath ?? null);
      }

      this.cargando.set(false);
    });
  }

  // ---------- Imagen ----------
  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const tiposOk = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposOk.includes(file.type)) {
      const mensaje = 'Formato no permitido. Usa JPG, PNG o WEBP.';
      this.errorGeneral.set(mensaje);
      input.value = '';
      toast.warning('Formato no permitido', { description: mensaje });
      return;
    }
    const maxMB = 5;
    if (file.size > maxMB * 1024 * 1024) {
      const mensaje = `La imagen no debe pesar más de ${maxMB} MB.`;
      this.errorGeneral.set(mensaje);
      input.value = '';
      toast.warning('Imagen demasiado grande', { description: mensaje });
      return;
    }

    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);

    this.errorGeneral.set(null);
    this.archivo.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  quitarImagenNueva(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.archivo.set(null);
    this.previewUrl.set(null);
  }

  onImageError(): void {
    this.imagenPath.set(null);
    this.previewUrl.set(null);
  }

  // ---------- Envío ----------
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorGeneral.set(null);

    if (this.archivo()) {
      this.subirImagenYGuardar();
    } else {
      this.guardar();
    }
  }

  private subirImagenYGuardar(): void {
    this.subiendoImagen.set(true);

    this.uploadService.subirImagen(this.archivo()!).subscribe({
      next: (res) => {
        this.imagenPath.set(res.path);
        this.subiendoImagen.set(false);
        this.guardar();
      },
      error: (err) => {
        console.error('Error al subir imagen', err);
        const mensaje = 'No se pudo subir la imagen. Intenta de nuevo.';
        this.errorGeneral.set(mensaje);
        this.subiendoImagen.set(false);
        toast.error('Error al subir la imagen', { description: mensaje });
      },
    });
  }

  private guardar(): void {
    this.guardando.set(true);
    const v = this.form.getRawValue();

    const body: UbicacionPatchModel = {
      id: this.ubicacionId(),
      nombre: v.nombre.trim(),
      direccion: v.direccion.trim(),
      imagenPath: this.imagenPath(),
      empresaId: v.empresaId!,
    };

    const nombreUbicacion = body.nombre;

    this.ubicacionService.actualizarUbicacion(body).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.guardado.emit(res);

        toast.success('Ubicación actualizada', {
          description: `${nombreUbicacion} se actualizó correctamente.`,
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar ubicación', err);
        const mensaje = this.extraerMensajeError(err);
        this.errorGeneral.set(mensaje);
        this.guardando.set(false);

        toast.error('No se pudo actualizar la ubicación', {
          description: mensaje,
        });
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  // ---------- Errores ----------
  errorDe(campo: 'nombre' | 'direccion' | 'empresaId'): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) {
      if (campo === 'nombre') return 'Debe ingresar un nombre';
      if (campo === 'direccion') return 'Debe ingresar una dirección';
      if (campo === 'empresaId') return 'Debe seleccionar una empresa';
    }
    if (control.hasError('minlength')) {
      return 'El nombre debe tener mínimo 3 caracteres';
    }
    if (control.hasError('maxlength')) {
      return 'El nombre debe tener máximo 50 caracteres';
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
    return 'No se pudo actualizar la ubicación.';
  }
}