import { Component, computed, input, output, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColaboradorResponse } from '../../models/colaborador.model';

@Component({
  selector: 'app-colaborador-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './colaborador-info.html',
  styleUrl: './colaborador-info.css',
})
export class ColaboradorInfo {
  colaborador = input.required<ColaboradorResponse>();

  editarDireccion = output<void>();
  editarLaboral = output<void>();
  editarConfidencial = output<void>();
  editarDatos = output<void>();

  private readonly imageFailed = signal(false);

  /** Controla el menú de 3 puntos */
  menuAbierto = signal(false);

  iniciales = computed(() => {
    const nombre = this.colaborador()?.nombreCompleto?.trim() ?? '';
    if (!nombre) return '?';
    const partes = nombre.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  });

  showAvatar = computed(() => {
    const path = this.colaborador()?.fotografia;
    if (!path || path.trim() === '' || path === 'no disponible') return true;
    return this.imageFailed();
  });

  onImageError(): void {
    this.imageFailed.set(true);
  }

  formatoSueldo(valor: number | null | undefined): string {
    if (valor == null) return '—';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 2,
    }).format(valor);
  }

  formatoHora(hora: string | null | undefined): string {
    if (!hora) return '—';
    return hora.length >= 5 ? hora.slice(0, 5) : hora;
  }

  // ---------- Menú de 3 puntos ----------
  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuAbierto.update((v) => !v);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  /** Cierra el menú al hacer click fuera */
  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.menuAbierto()) this.menuAbierto.set(false);
  }

  /** Cierra con Escape */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.menuAbierto()) this.menuAbierto.set(false);
  }

  // ---------- Acciones del menú ----------
  onEditarDatos(): void {
    this.cerrarMenu();
    this.editarDatos.emit();
  }

  onEditarLaboral(): void {
    this.cerrarMenu();
    this.editarLaboral.emit();
  }

  onEditarConfidencial(): void {
    this.cerrarMenu();
    this.editarConfidencial.emit();
  }

  onEditarDireccion(): void {
    this.cerrarMenu();
    this.editarDireccion.emit();
  }
}