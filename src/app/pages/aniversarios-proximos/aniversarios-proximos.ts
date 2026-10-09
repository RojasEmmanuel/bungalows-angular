import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { LaboralService } from '../../services/laboral.service';
import { AntiguedadesProximas } from '../../models/laboral.model';
import { AntiguedadProximaCardComponent } from '../../components/antiguedad-proxima-card/antiguedad-proxima-card';
import { Aniversarios } from '../../components/aniversarios/aniversarios';

@Component({
  selector: 'app-aniversarios-proximos',
  standalone: true,
  imports: [CommonModule, AntiguedadProximaCardComponent, Aniversarios],
  templateUrl: './aniversarios-proximos.html',
  styleUrl: './aniversarios-proximos.css',
})
export class AniversariosProximos implements OnInit {
  private readonly laboralService = inject(LaboralService);

  antiguedades = signal<AntiguedadesProximas[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarAniversarios();
  }

  private cargarAniversarios(): void {
    this.loading.set(true);
    this.error.set(null);

    this.laboralService.getAntiguedadesProximas().subscribe({
      next: (data) => {
        this.antiguedades.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar aniversarios próximos', err);
        this.error.set('No se pudieron cargar los aniversarios próximos.');
        this.loading.set(false);
      },
    });
  }
}