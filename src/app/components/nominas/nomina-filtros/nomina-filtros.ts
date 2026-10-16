import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NominaFiltros } from '../../../models/nomina.model';
import { Quincena } from '../../../utils/quincenas';

@Component({
  selector: 'app-nomina-filtros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nomina-filtros.html',
  styleUrl: './nomina-filtros.css',
})
export class NominaFiltrosComponent implements OnChanges {
  @Input() ejercicios: number[] = [];
  @Input() ejercicioSeleccionado?: number;
  @Input() quincenaActiva: Quincena | null = null;
  @Input() filtros: NominaFiltros = {};

  @Output() ejercicioChange = new EventEmitter<number>();
  @Output() quincenaChange = new EventEmitter<Quincena>();
  @Output() filtrosChange = new EventEmitter<NominaFiltros>();
  @Output() limpiar = new EventEmitter<void>();

  borrador: NominaFiltros = {};

  ngOnChanges(): void {
    this.borrador = { ...this.filtros };
  }

  aplicar(): void {
    this.filtrosChange.emit({ ...this.borrador });
  }

  onEjercicioChange(v: number): void {
    this.ejercicioChange.emit(v);
  }

  onQuincena(q: Quincena): void {
    this.quincenaChange.emit(q);
  }
}