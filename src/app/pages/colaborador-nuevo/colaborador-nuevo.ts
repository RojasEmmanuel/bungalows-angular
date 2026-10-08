import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ColaboradorForm } from '../../components/colaborador-form/colaborador-form';
import { ColaboradorTable } from '../../models/colaborador.model';

@Component({
  selector: 'app-colaborador-nuevo',
  standalone: true,
  imports: [ColaboradorForm],
  templateUrl: './colaborador-nuevo.html',
  styleUrl: './colaborador-nuevo.css',
})
export class ColaboradorNuevoComponent {
  private readonly router = inject(Router);

  onCreado(_c: ColaboradorTable): void {
    // Vuelve al listado (podrías pasar un query param o usar un toast)
    this.router.navigate(['/colaboradores']);
  }

  onCancelado(): void {
    this.router.navigate(['/colaboradores']);
  }
}