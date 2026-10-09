import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { ColaboradorService } from '../../services/colaborador.service';
import { ColaboradorTableComponent } from '../../components/colaborador-table/colaborador-table';
import { ColaboradorTable } from '../../models/colaborador.model';

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [CommonModule, ColaboradorTableComponent, RouterLink],
  templateUrl: './colaboradores.html',
  styleUrl: './colaboradores.css',
})
export class ColaboradoresComponent implements OnInit {
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly router = inject(Router);

  colaboradores = signal<ColaboradorTable[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.cargarColaboradores();
  }

  onVerColaborador(id: number): void {
    this.router.navigate(['/colaboradores', id]);
  }

  private cargarColaboradores(): void {
    this.loading.set(true);
    this.error.set(null);

    this.colaboradorService.getColaboradores().subscribe({
      next: (data) => {
        this.colaboradores.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar colaboradores', err);
        this.error.set('No se pudieron cargar los colaboradores.');
        this.loading.set(false);
      },
    });
  }
}