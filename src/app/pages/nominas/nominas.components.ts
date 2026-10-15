import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NominaFormComponent } from '../../components/nominas/nomina-form/nomina-form';
import { NominaResumenComponent } from '../../components/nominas/nomina-resumen/nomina-resumen';
import { PercepcionRequest, DeduccionRequest } from '../../models/nomina.model';
import { LaboralNominaResponse } from '../../models/laboral.model';
import { EnumOption } from '../../models/enum-option.model';
import { NominaService } from '../../services/nomina.service';

@Component({
  selector: 'app-nominas',
  standalone: true,
  imports: [CommonModule, NominaFormComponent, NominaResumenComponent],
  templateUrl: 'nominas.components.html' ,
  styleUrl: 'nominas.components.css',
})
export class NominasComponent {
  private nominaService = inject(NominaService);

  laboral = signal<LaboralNominaResponse | null>(null);
  periodo = signal<{ inicio: string; fin: string; dias: number }>({ inicio: '', fin: '', dias: 0 });
  percepciones = signal<PercepcionRequest[]>([]);
  deducciones = signal<DeduccionRequest[]>([]);
  tiposDeducciones = signal<EnumOption[]>([]);

  nominaId = signal<number | null>(null);
  descargandoPdf = signal(false);

  onNominaCreada(id: number): void {
    this.nominaId.set(id);
  }

  descargarPdf(): void {
    const id = this.nominaId();
    if (id == null || this.descargandoPdf()) return;

    this.descargandoPdf.set(true);

    this.nominaService.descargarPdf(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 30_000);
        this.descargandoPdf.set(false);
      },
      error: (err) => {
        console.error('Error al descargar PDF', err);
        this.descargandoPdf.set(false);
      },
    });
  }

  cerrarBanner(): void {
    this.nominaId.set(null);
  }
}