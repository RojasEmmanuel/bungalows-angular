import { Component, computed, input, output, signal } from '@angular/core';
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

  /** Emite cuando el usuario pide editar la dirección */
  editarDireccion = output<void>();
  editarLaboral = output<void>(); 
  editarConfidencial = output<void>(); 
  editarDatos = output<void>();  

  private readonly imageFailed = signal(false);

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

  onEditarDireccion(): void {
    this.editarDireccion.emit();
  }

  onEditarLaboral(): void {
    this.editarLaboral.emit();
  }

  onEditarConfidencial(): void {
    this.editarConfidencial.emit();
  }

  onEditarDatos(): void {
    this.editarDatos.emit();
  }
}