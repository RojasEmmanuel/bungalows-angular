import { Component, computed, inject, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; 
import { ContactoService } from '../../services/contacto.service';
import { EnumsService } from '../../services/enums.service';
import {
  ContactoRequest,
  ContactoResponse,
  ContactoPatch,
} from '../../models/contacto.model';
import { EnumOption } from '../../models/enum-option.model';

@Component({
  selector: 'app-colaborador-contactos',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './colaborador-contacto.html',
  styleUrl: './colaborador-contacto.css',
})
export class ColaboradorContactos implements OnInit {
  private readonly contactoService = inject(ContactoService);
  private readonly enumsService = inject(EnumsService);

  /** ID del colaborador (obligatorio) */
  colaboradorId = input.required<number>();

  // ---------- Estado de la lista ----------
  contactos = signal<ContactoResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // ---------- Catálogo de tipos de contacto ----------
  tiposContacto = signal<EnumOption[]>([]);

  // ---------- Estado de modales ----------
  modalCrearAbierto = signal(false);
  modalEditarAbierto = signal(false);
  modalEliminarAbierto = signal(false);

  /** Contacto en edición / eliminación */
  contactoSeleccionado = signal<ContactoResponse | null>(null);

  /** Form de crear/editar */
  formTipo = signal('');
  formContacto = signal('');

  guardando = signal(false);
  errorForm = signal<string | null>(null);

  // ---------- Computed ----------
  tituloModalCrear = computed(() => 'Nuevo contacto');
  tituloModalEditar = computed(() => 'Editar contacto');

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarTiposContacto();
    this.cargarContactos();
  }

  // ---------- Carga de datos ----------
  private cargarContactos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.contactoService.getContactosByColaboradorId(this.colaboradorId()).subscribe({
      next: (data) => {
        this.contactos.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar contactos', err);
        this.error.set('No se pudieron cargar los contactos.');
        this.loading.set(false);
      },
    });
  }

  private cargarTiposContacto(): void {
    this.enumsService.getTiposContacto().subscribe({
      next: (data) => this.tiposContacto.set(data),
      error: (err) => console.error('Error al cargar tipos de contacto', err),
    });
  }

  // ---------- MODAL CREAR ----------
  abrirModalCrear(): void {
    this.errorForm.set(null);
    this.formTipo.set(this.tiposContacto()[0]?.value ?? '');
    this.formContacto.set('');
    this.modalCrearAbierto.set(true);
  }

  cerrarModalCrear(): void {
    if (this.guardando()) return;
    this.modalCrearAbierto.set(false);
  }

  // ---------- MODAL EDITAR ----------
  abrirModalEditar(contacto: ContactoResponse): void {
    this.errorForm.set(null);
    this.contactoSeleccionado.set(contacto);
    this.formTipo.set(contacto.tipo);
    this.formContacto.set(contacto.contacto);
    this.modalEditarAbierto.set(true);
  }

  cerrarModalEditar(): void {
    if (this.guardando()) return;
    this.modalEditarAbierto.set(false);
    this.contactoSeleccionado.set(null);
  }

  // ---------- MODAL ELIMINAR ----------
  abrirModalEliminar(contacto: ContactoResponse): void {
    this.contactoSeleccionado.set(contacto);
    this.modalEliminarAbierto.set(true);
  }

  cerrarModalEliminar(): void {
    if (this.guardando()) return;
    this.modalEliminarAbierto.set(false);
    this.contactoSeleccionado.set(null);
  }

  // ---------- Form handlers ----------
  onTipoChange(event: Event): void {
    this.formTipo.set((event.target as HTMLSelectElement).value);
  }

  onContactoChange(event: Event): void {
    this.formContacto.set((event.target as HTMLInputElement).value);
  }

  // ---------- GUARDAR (crear) ----------
  guardarNuevo(): void {
    const tipo = this.formTipo();
    const contacto = this.formContacto().trim();

    if (!tipo) {
      this.errorForm.set('Selecciona un tipo de contacto.');
      return;
    }
    if (!contacto) {
      this.errorForm.set('Ingresa el dato de contacto.');
      return;
    }

    this.guardando.set(true);
    this.errorForm.set(null);

    const body: ContactoRequest = {
      colaboradorId: this.colaboradorId(),
      tipoContacto: tipo,
      contacto,
    };

    this.contactoService.crearContacto(body).subscribe({
      next: (res) => {
        this.contactos.update((lista) => [...lista, res]);
        this.guardando.set(false);
        this.modalCrearAbierto.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al crear contacto', err);
        this.errorForm.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  // ---------- GUARDAR (editar) ----------
  guardarEdicion(): void {
    const original = this.contactoSeleccionado();
    if (!original) return;

    const tipo = this.formTipo();
    const contacto = this.formContacto().trim();

    if (!tipo) {
      this.errorForm.set('Selecciona un tipo de contacto.');
      return;
    }
    if (!contacto) {
      this.errorForm.set('Ingresa el dato de contacto.');
      return;
    }

    this.guardando.set(true);
    this.errorForm.set(null);

    const body: ContactoPatch = {
      id: original.id,
      tipoContacto: tipo,
      contacto,
    };

    this.contactoService.actualizarContacto(body).subscribe({
      next: () => {
        this.contactos.update((lista) =>
          lista.map((c) =>
            c.id === original.id
              ? { ...c, tipo, contacto }
              : c
          )
        );
        this.guardando.set(false);
        this.modalEditarAbierto.set(false);
        this.contactoSeleccionado.set(null);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar contacto', err);
        this.errorForm.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  // ---------- ELIMINAR ----------
  confirmarEliminar(): void {
    const contacto = this.contactoSeleccionado();
    if (!contacto) return;

    this.guardando.set(true);

    this.contactoService.eliminarContacto(contacto.id).subscribe({
      next: () => {
        this.contactos.update((lista) =>
          lista.filter((c) => c.id !== contacto.id)
        );
        this.guardando.set(false);
        this.modalEliminarAbierto.set(false);
        this.contactoSeleccionado.set(null);
      },
      error: (err) => {
        console.error('Error al eliminar contacto', err);
        this.guardando.set(false);
        // Podrías mostrar un toast aquí
      },
    });
  }

  // ---------- Helpers ----------
  private extraerMensajeError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body?.errors && typeof body.errors === 'object') {
      return (Object.values(body.errors) as string[]).join(', ');
    }
    if (body?.message) return body.message;
    if (err.status === 0) return 'Sin conexión con el servidor.';
    return 'No se pudo guardar el contacto.';
  }

  /** Label legible del tipo de contacto */
  labelTipo(value: string): string {
    const opt = this.tiposContacto().find((t) => t.value === value);
    return opt?.label ?? value;
  }
}