import {
  Component,
  inject,
  output,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { toast } from 'ngx-sonner';

import { empresaService } from '../../../services/empresa.service';
import { UploadLogoEmpresaService } from '../../../services/upload/logo-empresa.service'; 
import { empresaRequest } from '../../../models/empresa.model';

@Component({
  selector: 'app-empresa-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './empresa-form.html',
  styleUrl: './empresa-form.css',
})
export class EmpresaForm implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly empresaService = inject(empresaService);
  private readonly uploadService = inject(UploadLogoEmpresaService);

  /** Emite cuando se crea la empresa */
  creada = output<void>();
  /** Emite cuando el usuario cancela */
  cancelada = output<void>();

  // ---------- Formulario ----------
  form = this.fb.nonNullable.group({
    nombreLegal: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(120),
      ],
    ],
    responsable: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(80),
      ],
    ],
    registroFiscal: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(20),
      ],
    ],
    direccion: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(200),
      ],
    ],
    registroPatronal: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(20),
      ],
    ],
  });

  // ---------- Estado del logo ----------
  archivo = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  logoPath = signal<string | null>(null);

  // ---------- Estados de UI ----------
  subiendoLogo = signal(false);
  guardando = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Computed ----------
  hayArchivo = computed(() => this.archivo() !== null);
  nombreArchivo = computed(() => this.archivo()?.name ?? '');
  enviando = computed(() => this.subiendoLogo() || this.guardando());
  iniciales = computed(() => {
    const nombre = this.form.getRawValue().nombreLegal?.trim() ?? '';
    if (!nombre) return '?';
    const partes = nombre.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  });

  // ---------- Logo ----------
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
      const mensaje = `El logo no debe pesar más de ${maxMB} MB.`;
      this.errorGeneral.set(mensaje);
      input.value = '';
      toast.warning('Logo demasiado grande', { description: mensaje });
      return;
    }

    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);

    this.errorGeneral.set(null);
    this.archivo.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  quitarLogo(): void {
    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);
    this.archivo.set(null);
    this.previewUrl.set(null);
    this.logoPath.set(null);
  }

  // ---------- Envío ----------
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorGeneral.set(null);

    if (this.archivo()) {
      this.subirLogoYCrear();
    } else {
      this.crearEmpresa();
    }
  }

  private subirLogoYCrear(): void {
    this.subiendoLogo.set(true);

    this.uploadService.subirDocumento(this.archivo()!).subscribe({
      next: (res) => {
        this.logoPath.set(res.path);
        this.subiendoLogo.set(false);
        this.crearEmpresa();
      },
      error: (err) => {
        console.error('Error al subir logo', err);
        const mensaje = 'No se pudo subir el logo. Intenta de nuevo.';
        this.errorGeneral.set(mensaje);
        this.subiendoLogo.set(false);
        toast.error('Error al subir el logo', { description: mensaje });
      },
    });
  }

  private crearEmpresa(): void {
    this.guardando.set(true);
    const v = this.form.getRawValue();

    const body: empresaRequest = {
      nombreLegal: v.nombreLegal.trim(),
      responsable: v.responsable.trim(),
      registroFiscal: v.registroFiscal.trim(),
      direccion: v.direccion.trim(),
      registroPatronal: v.registroPatronal.trim(),
      logoPath: this.logoPath() ?? 'no disponible',
    };

    const nombreEmpresa = body.nombreLegal;

    this.empresaService.crearEmpresa(body).subscribe({
      next: () => {
        this.guardando.set(false);
        toast.success('Empresa creada', {
          description: `${nombreEmpresa} se registró correctamente.`,
        });
        this.creada.emit();
        this.reset();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al crear empresa', err);
        const mensaje = this.extraerMensajeError(err);
        this.errorGeneral.set(mensaje);
        this.guardando.set(false);

        toast.error('No se pudo crear la empresa', {
          description: mensaje,
        });
      },
    });
  }

  cancelar(): void {
    this.cancelada.emit();
  }

  // ---------- Helpers ----------
  private reset(): void {
    this.form.reset({
      nombreLegal: '',
      responsable: '',
      registroFiscal: '',
      direccion: '',
      registroPatronal: '',
    });
    this.quitarLogo();
    this.logoPath.set(null);
  }

  private extraerMensajeError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body?.errors && typeof body.errors === 'object') {
      const mensajes = Object.values(body.errors) as string[];
      return mensajes.join(', ');
    }
    if (body?.message) return body.message;
    if (err.status === 0) return 'Sin conexión con el servidor.';
    return 'No se pudo crear la empresa. Intenta de nuevo.';
  }

  mostrarError(
    campo:
      | 'nombreLegal'
      | 'responsable'
      | 'registroFiscal'
      | 'direccion'
      | 'registroPatronal'
  ): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || control.valid) return null;

    if (control.hasError('required')) {
      switch (campo) {
        case 'nombreLegal':
          return 'Debe ingresar el nombre legal';
        case 'responsable':
          return 'Debe ingresar el responsable';
        case 'registroFiscal':
          return 'Debe ingresar el registro fiscal';
        case 'direccion':
          return 'Debe ingresar la dirección';
        case 'registroPatronal':
          return 'Debe ingresar el registro patronal';
      }
    }
    if (control.hasError('minlength')) {
      return 'El valor es demasiado corto';
    }
    if (control.hasError('maxlength')) {
      return 'El valor es demasiado largo';
    }
    return null;
  }

  ngOnDestroy(): void {
    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);
  }
}