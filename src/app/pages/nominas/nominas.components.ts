// nominas/nominas.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NominaFormComponent } from '../../components/nominas/nomina-form/nomina-form';
import { NominaResumenComponent } from '../../components/nominas/nomina-resumen/nomina-resumen';
import { NominasListado } from '../../components/nominas/nominas-listado/nominas-listado';  // ← ajusta el path
import { PercepcionRequest, DeduccionRequest } from '../../models/nomina.model';
import { LaboralNominaResponse } from '../../models/laboral.model';
import { EnumOption } from '../../models/enum-option.model';
import { NominaService } from '../../services/nomina.service';

type Tab = 'nueva' | 'historial';

@Component({
  selector: 'app-nominas',
  standalone: true,
  imports: [
    CommonModule,
    NominaFormComponent,
    NominaResumenComponent,
    NominasListado,
  ],
  templateUrl: 'nominas.components.html',
  styleUrl: 'nominas.components.css',
})
export class NominasComponent {
  private nominaService = inject(NominaService);

  // ── Estado de tabs
  tabActivo = signal<Tab>('nueva');

  // ── Estado del formulario
  laboral = signal<LaboralNominaResponse | null>(null);
  periodo = signal<{ inicio: string; fin: string; dias: number }>({ inicio: '', fin: '', dias: 0 });
  percepciones = signal<PercepcionRequest[]>([]);
  deducciones = signal<DeduccionRequest[]>([]);
  tiposDeducciones = signal<EnumOption[]>([]);

  nominaId = signal<number | null>(null);
  descargandoPdf = signal(false);

  seleccionarTab(tab: Tab): void {
    this.tabActivo.set(tab);
  }

  onNominaCreada(id: number): void {
    this.nominaId.set(id);
    // Opcional: después de crear, cambiar al historial para ver la nueva
    // this.tabActivo.set('historial');
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