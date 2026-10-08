import { Component, inject, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { ResponsableService } from '../../services/responsable.service';
import { EnumsService } from '../../services/enums.service';
import {
  ResponsableRequest,
  ResponsableResponse,
  ResponsablePatch,
} from '../../models/responsable.model';
import { EnumOption } from '../../models/enum-option.model';

@Component({
  selector: 'app-responsable',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './responsable.html',
  styleUrl: './responsable.css',
})
export class Responsable implements OnInit {
  private readonly responsableService = inject(ResponsableService);
  private readonly enumsService = inject(EnumsService);

  /** ID del colaborador (obligatorio) */
  colaboradorId = input.required<number>();

  // ---------- Estado de la lista ----------
  responsables = signal<ResponsableResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // ---------- Catálogo de parentescos ----------
  parentescos = signal<EnumOption[]>([]);

  // ---------- Estado de modales ----------
  modalCrearAbierto = signal(false);
  modalEditarAbierto = signal(false);
  modalEliminarAbierto = signal(false);

  /** Responsable en edición / eliminación */
  responsableSeleccionado = signal<ResponsableResponse | null>(null);

  /** Form de crear/editar */
  formNombre = signal('');
  formParentesco = signal('');
  formTelefono = signal('');

  guardando = signal(false);
  errorForm = signal<string | null>(null);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarParentescos();
    this.cargarResponsables();
  }

  // ---------- Carga de datos ----------
  private cargarParentescos(): void {
    this.enumsService.getParentescos().subscribe({
      next: (data) => this.parentescos.set(data),
      error: (err) => console.error('Error al cargar parentescos', err),
    });
  }

  private cargarResponsables(): void {
    this.loading.set(true);
    this.error.set(null);

    this.responsableService
      .getResponsablesByColaboradorId(this.colaboradorId())
      .subscribe({
        next: (data) => {
          this.responsables.set(data);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al cargar responsables', err);
          this.error.set('No se pudieron cargar los responsables.');
          this.loading.set(false);
        },
      });
  }

  // ---------- Modal CREAR ----------
  abrirModalCrear(): void {
    this.errorForm.set(null);
    this.formNombre.set('');
    this.formParentesco.set(this.parentescos()[0]?.value ?? '');
    this.formTelefono.set('');
    this.modalCrearAbierto.set(true);
  }

  cerrarModalCrear(): void {
    if (this.guardando()) return;
    this.modalCrearAbierto.set(false);
  }

  // ---------- Modal EDITAR ----------
  abrirModalEditar(r: ResponsableResponse): void {
    this.errorForm.set(null);
    this.responsableSeleccionado.set(r);
    this.formNombre.set(r.nombre);
    this.formParentesco.set(this.normalizarParentesco(r.parentesco));
    this.formTelefono.set(r.telefono);
    this.modalEditarAbierto.set(true);
  }

  cerrarModalEditar(): void {
    if (this.guardando()) return;
    this.modalEditarAbierto.set(false);
    this.responsableSeleccionado.set(null);
  }

  // ---------- Modal ELIMINAR ----------
  abrirModalEliminar(r: ResponsableResponse): void {
    this.responsableSeleccionado.set(r);
    this.modalEliminarAbierto.set(true);
  }

  cerrarModalEliminar(): void {
    if (this.guardando()) return;
    this.modalEliminarAbierto.set(false);
    this.responsableSeleccionado.set(null);
  }

  // ---------- Form handlers ----------
  onNombreChange(event: Event): void {
    this.formNombre.set((event.target as HTMLInputElement).value);
  }

  onParentescoChange(event: Event): void {
    this.formParentesco.set((event.target as HTMLSelectElement).value);
  }

  onTelefonoChange(event: Event): void {
    this.formTelefono.set((event.target as HTMLInputElement).value);
  }

  // ---------- GUARDAR (crear) ----------
  guardarNuevo(): void {
    const nombre = this.formNombre().trim();
    const parentesco = this.formParentesco();
    const telefono = this.formTelefono().trim();

    if (!nombre) {
      this.errorForm.set('Ingresa el nombre del responsable.');
      return;
    }
    if (!parentesco) {
      this.errorForm.set('Selecciona el parentesco.');
      return;
    }
    if (!telefono) {
      this.errorForm.set('Ingresa el teléfono.');
      return;
    }

    this.guardando.set(true);
    this.errorForm.set(null);

    const body: ResponsableRequest = {
      nombre,
      parentesco,
      telefono,
      colaboradorId: this.colaboradorId(),
    };

    this.responsableService.crearResponsable(body).subscribe({
      next: (res) => {
        this.responsables.update((lista) => [...lista, res]);
        this.guardando.set(false);
        this.modalCrearAbierto.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al crear responsable', err);
        this.errorForm.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  // ---------- GUARDAR (editar) ----------
  guardarEdicion(): void {
    const original = this.responsableSeleccionado();
    if (!original) return;

    const nombre = this.formNombre().trim();
    const parentesco = this.formParentesco();
    const telefono = this.formTelefono().trim();

    if (!nombre || !parentesco || !telefono) {
      this.errorForm.set('Todos los campos son obligatorios.');
      return;
    }

    this.guardando.set(true);
    this.errorForm.set(null);

    const body: ResponsablePatch = {
      id: original.id,
      nombre,
      parentesco,
      telefono,
    };

    this.responsableService.actualizarResponsable(body).subscribe({
      next: () => {
        this.responsables.update((lista) =>
          lista.map((r) =>
            r.id === original.id ? { ...r, nombre, parentesco, telefono } : r
          )
        );
        this.guardando.set(false);
        this.modalEditarAbierto.set(false);
        this.responsableSeleccionado.set(null);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al actualizar responsable', err);
        this.errorForm.set(this.extraerMensajeError(err));
        this.guardando.set(false);
      },
    });
  }

  // ---------- ELIMINAR ----------
  confirmarEliminar(): void {
    const r = this.responsableSeleccionado();
    if (!r) return;

    this.guardando.set(true);

    this.responsableService.eliminarResponsable(r.id).subscribe({
      next: () => {
        this.responsables.update((lista) => lista.filter((x) => x.id !== r.id));
        this.guardando.set(false);
        this.modalEliminarAbierto.set(false);
        this.responsableSeleccionado.set(null);
      },
      error: (err) => {
        console.error('Error al eliminar responsable', err);
        this.guardando.set(false);
      },
    });
  }

  // ---------- Helpers ----------
  /**
   * Normaliza el valor del parentesco del backend para que coincida con un
   * `value` del catálogo. Acepta "MADRE" o "Madre" y devuelve "MADRE".
   */
  private normalizarParentesco(valor: string | null | undefined): string {
    const opciones = this.parentescos();
    if (!valor) return opciones[0]?.value ?? '';

    const porValue = opciones.find((o) => o.value === valor);
    if (porValue) return porValue.value;

    const porLabel = opciones.find(
      (o) => o.label.toLowerCase() === valor.toLowerCase()
    );
    if (porLabel) return porLabel.value;

    return opciones[0]?.value ?? '';
  }

  /** Label legible del parentesco */
  labelParentesco(value: string): string {
    const opt = this.parentescos().find((p) => p.value === value);
    return opt?.label ?? value;
  }

  private extraerMensajeError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body?.errors && typeof body.errors === 'object') {
      return (Object.values(body.errors) as string[]).join(', ');
    }
    if (body?.message) return body.message;
    if (err.status === 0) return 'Sin conexión con el servidor.';
    return 'No se pudo guardar el responsable.';
  }
}