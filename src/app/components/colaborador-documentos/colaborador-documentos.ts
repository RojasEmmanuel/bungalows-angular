import { Component, inject, input, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { DocumentoService } from '../../services/documento.service';
import { UploadDocumentoService } from '../../services/upload/documento-upload.service';
import {
  DocumentoRequest,
  DocumentoResponse,
} from '../../models/documento.model';

@Component({
  selector: 'app-colaborador-documentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './colaborador-documentos.html',
  styleUrl: './colaborador-documentos.css',
})
export class ColaboradorDocumentos implements OnInit {
  private readonly documentoService = inject(DocumentoService);
  private readonly uploadService = inject(UploadDocumentoService);

  colaboradorId = input.required<number>();

  // ---------- Lista ----------
  documentos = signal<DocumentoResponse[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // ---------- Modal crear ----------
  modalAbierto = signal(false);
  archivoSeleccionado = signal<File | null>(null);
  nombreDocumento = signal('');
  subiendo = signal(false);
  errorSubida = signal<string | null>(null);

  // ---------- Modal eliminar ----------
  modalEliminarAbierto = signal(false);
  documentoAEliminar = signal<DocumentoResponse | null>(null);
  eliminando = signal(false);

  // ---------- Ciclo de vida ----------
  ngOnInit(): void {
    this.cargarDocumentos();
  }

  // ---------- Carga ----------
  private cargarDocumentos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.documentoService.getDocumentosByColaboradorId(this.colaboradorId()).subscribe({
      next: (data) => {
        this.documentos.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar documentos', err);
        this.error.set('No se pudieron cargar los documentos.');
        this.loading.set(false);
      },
    });
  }

  // ---------- Modal crear ----------
  abrirModal(): void {
    this.errorSubida.set(null);
    this.archivoSeleccionado.set(null);
    this.nombreDocumento.set('');
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    if (this.subiendo()) return;
    this.modalAbierto.set(false);
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const maxMB = 10;
    if (file.size > maxMB * 1024 * 1024) {
      this.errorSubida.set(`El archivo no debe pesar más de ${maxMB} MB.`);
      input.value = '';
      return;
    }

    this.errorSubida.set(null);
    this.archivoSeleccionado.set(file);

    if (!this.nombreDocumento().trim()) {
      const sinExt = file.name.replace(/\.[^.]+$/, '');
      this.nombreDocumento.set(sinExt);
    }
  }

  onNombreChange(event: Event): void {
    this.nombreDocumento.set((event.target as HTMLInputElement).value);
  }

  guardarDocumento(): void {
    const file = this.archivoSeleccionado();
    const nombre = this.nombreDocumento().trim();

    if (!file) {
      this.errorSubida.set('Selecciona un archivo.');
      return;
    }
    if (!nombre) {
      this.errorSubida.set('Ingresa un nombre para el documento.');
      return;
    }

    this.subiendo.set(true);
    this.errorSubida.set(null);

    this.uploadService.subirDocumento(file).subscribe({
      next: (uploadRes) => {
        const body: DocumentoRequest = {
          nombre,
          path: uploadRes.path,
          colaboradorId: this.colaboradorId(),
        };

        this.documentoService.crearDocumento(body).subscribe({
          next: (doc) => {
            this.documentos.update((lista) => [...lista, doc]);
            this.subiendo.set(false);
            this.modalAbierto.set(false);
          },
          error: (err: HttpErrorResponse) => {
            console.error('Error al registrar documento', err);
            this.errorSubida.set(this.extraerMensajeError(err));
            this.subiendo.set(false);
          },
        });
      },
      error: (err) => {
        console.error('Error al subir archivo', err);
        this.errorSubida.set('No se pudo subir el archivo. Intenta de nuevo.');
        this.subiendo.set(false);
      },
    });
  }

  // ---------- Modal eliminar ----------
  abrirModalEliminar(doc: DocumentoResponse): void {
    this.documentoAEliminar.set(doc);
    this.modalEliminarAbierto.set(true);
  }

  cerrarModalEliminar(): void {
    if (this.eliminando()) return;
    this.modalEliminarAbierto.set(false);
    this.documentoAEliminar.set(null);
  }

  confirmarEliminar(): void {
    const doc = this.documentoAEliminar();
    if (!doc) return;

    this.eliminando.set(true);

    this.documentoService.eliminarDocumento(doc.id).subscribe({
      next: () => {
        this.documentos.update((lista) =>
          lista.filter((d) => d.id !== doc.id)
        );
        this.eliminando.set(false);
        this.modalEliminarAbierto.set(false);
        this.documentoAEliminar.set(null);
      },
      error: (err) => {
        console.error('Error al eliminar documento', err);
        this.eliminando.set(false);
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
    return 'No se pudo registrar el documento.';
  }

  nombreArchivo = (path: string): string => {
    if (!path) return '—';
    const idx = path.lastIndexOf('/');
    return idx >= 0 ? path.slice(idx + 1) : path;
  };

  esImagen = (path: string): boolean => {
    if (!path) return false;
    const p = path.toLowerCase();
    return (
      p.endsWith('.jpg') ||
      p.endsWith('.jpeg') ||
      p.endsWith('.png') ||
      p.endsWith('.webp')
    );
  };

  esPdf = (path: string): boolean => {
    return !!path && path.toLowerCase().endsWith('.pdf');
  };
}