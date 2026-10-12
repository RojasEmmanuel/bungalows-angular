import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  effect,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { toast } from 'ngx-sonner';

import { empresaService } from '../../../services/empresa.service'; 
import { UploadLogoEmpresaService } from '../../../services/upload/logo-empresa.service';
import { empresaPatch, empresaResponse } from '../../../models/empresa.model';

@Component({
  selector: 'app-empresa-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './empresa-edit.html',
  styleUrl: './empresa-edit.css',
})
export class EmpresaEdit implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly empresaService = inject(empresaService);
  private readonly uploadService = inject(UploadLogoEmpresaService);

  empresaId = input.required<number>();

  /** Se emite al guardar correctamente. El padre solo necesita saber que terminó. */
  guardado = output<void>();
  /** Se emite al cancelar. */
  cancelado = output<void>();

  // ---------- Datos de la empresa ----------
  empresa = signal<empresaResponse | null>(null);
  cargando = signal(false);
  errorGeneral = signal<string | null>(null);

  // ---------- Form editable ----------
  form = this.fb.nonNullable.group({
    direccion: [''],
    registroPatronal: [''],
  });

  // ---------- Logo ----------
  archivo = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  logoPath = signal<string | null>(null);
  logoRoto = signal(false);
  logoEliminado = signal(false);

  // ---------- UI ----------
  subiendoLogo = signal(false);
  guardando = signal(false);
  enviando = computed(() => this.subiendoLogo() || this.guardando());
  hayArchivo = computed(() => this.archivo() !== null);
  nombreArchivo = computed(() => this.archivo()?.name ?? '');

  tieneLogoVisible = computed(() => {
    if (this.previewUrl()) return true;
    if (this.logoEliminado()) return false;
    if (this.logoRoto()) return false;
    const p = this.logoPath()?.trim();
    if (!p) return false;
    return p.toLowerCase() !== 'no disponible';
  });

  urlLogo = computed(() => this.previewUrl() ?? this.logoPath() ?? '');

  iniciales = computed(() => {
    const nombre = this.empresa()?.nombreLegal?.trim() ?? '';
    if (!nombre) return '?';
    const partes = nombre.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  });

  constructor() {
    effect(() => {
      const id = this.empresaId();
      if (id != null) this.cargarEmpresa(id);
    });
  }

  private cargarEmpresa(id: number): void {
    this.cargando.set(true);
    this.errorGeneral.set(null);
    this.logoRoto.set(false);
    this.logoEliminado.set(false);

    this.empresaService.getEmpresaById(id).subscribe({
      next: (emp) => {
        this.empresa.set(emp);
        this.logoPath.set(emp.logoPath ?? null);
        this.form.patchValue({
          direccion: emp.direccion ?? '',
          registroPatronal: emp.registroPatronal ?? '',
        });
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar empresa', err);
        this.errorGeneral.set('No se pudieron cargar los datos de la empresa.');
        this.cargando.set(false);
      },
    });
  }

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
    this.logoEliminado.set(false);
    this.logoRoto.set(false);
  }

  quitarLogo(): void {
    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);
    this.archivo.set(null);
    this.previewUrl.set(null);
    this.logoPath.set(null);
    this.logoRoto.set(false);
    this.logoEliminado.set(true);
  }

  onLogoError(): void {
    this.logoRoto.set(true);
  }

  // ---------- Envío ----------
  submit(): void {
    if (this.form.invalid || this.enviando()) return;
    this.errorGeneral.set(null);

    if (this.archivo()) {
      this.subirLogoYGuardar();
    } else {
      this.guardarCambios();
    }
  }

  private subirLogoYGuardar(): void {
    this.subiendoLogo.set(true);

    this.uploadService.subirDocumento(this.archivo()!).subscribe({
      next: (res) => {
        this.logoPath.set(res.path);
        this.logoEliminado.set(false);
        this.logoRoto.set(false);
        this.subiendoLogo.set(false);
        this.guardarCambios();
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

  private guardarCambios(): void {
    const emp = this.empresa();
    if (!emp) return;

    this.guardando.set(true);
    const v = this.form.getRawValue();

    const body: empresaPatch = {
      id: emp.id,
      direccion: this.nullSiVacio(v.direccion),
      registroPatronal: this.nullSiVacio(v.registroPatronal),
      logoPath: this.logoEliminado() ? null : this.logoPath(),
    };

    this.empresaService.actualizarEmpresa(emp.id, body).subscribe({
      next: () => {
        this.guardando.set(false);
        toast.success('Empresa actualizada', {
          description: `${emp.nombreLegal} se actualizó correctamente.`,
        });
        this.guardado.emit();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar empresa', err);
        const mensaje = this.extraerMensajeError(err);
        this.errorGeneral.set(mensaje);
        this.guardando.set(false);
        toast.error('No se pudo actualizar la empresa', { description: mensaje });
      },
    });
  }

  cancelar(): void {
    this.cancelado.emit();
  }

  private nullSiVacio(valor: string | null | undefined): string | null {
    const v = (valor ?? '').trim();
    return v.length === 0 ? null : v;
  }

  private extraerMensajeError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body?.errors && typeof body.errors === 'object') {
      return (Object.values(body.errors) as string[]).join(', ');
    }
    if (body?.message) return body.message;
    if (err.status === 0) return 'Sin conexión con el servidor.';
    return 'No se pudo actualizar la empresa. Intenta de nuevo.';
  }

  ngOnDestroy(): void {
    const anterior = this.previewUrl();
    if (anterior) URL.revokeObjectURL(anterior);
  }
}