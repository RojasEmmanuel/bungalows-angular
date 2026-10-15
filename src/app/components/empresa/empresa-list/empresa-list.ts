import { Component, inject, OnInit, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { toast } from 'ngx-sonner';

import { empresaService } from '../../../services/empresa.service';
import { empresaResponse } from '../../../models/empresa.model';
import { EmptyStateComponent } from '../../empty-state/empty-state';

interface EmpresaConProgreso extends empresaResponse {
  /** 0–100 */
  progreso: number;
  /** Campos faltantes para tooltip */
  faltantes: string[];
}

@Component({
  selector: 'app-empresa-list',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './empresa-list.html',
  styleUrl: './empresa-list.css',
})
export class EmpresaList implements OnInit {
  private readonly empresaService = inject(empresaService);

  empresas = signal<EmpresaConProgreso[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  // Campos que se evalúan para el progreso
  private readonly camposEvaluados: { key: keyof empresaResponse; label: string }[] = [
    { key: 'nombreLegal', label: 'Nombre legal' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'regimenFiscal', label: 'Regimen fiscal' },
    { key: 'registroPatronal', label: 'Registro patronal' },
    { key: 'direccion', label: 'Dirección' },
    { key: 'logoPath', label: 'Logo' },
  ];

  // ---------- Outputs ----------
  crear = output<void>();
  /** Se emite al hacer click en una empresa: el padre abre el modal de edición */
  editar = output<number>();

  ngOnInit(): void {
    this.cargarEmpresas();
  }

  private cargarEmpresas(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.empresaService.getEmpresas().subscribe({
      next: (data) => {
        this.empresas.set(data.map((e) => this.calcularProgreso(e)));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al cargar empresas', err);
        this.error.set('No se pudieron cargar las empresas.');
        this.cargando.set(false);
        toast.error('Error al cargar empresas', {
          description: 'Intenta de nuevo más tarde.',
        });
      },
    });
  }

  private calcularProgreso(e: empresaResponse): EmpresaConProgreso {
    const faltantes: string[] = [];
    let completos = 0;

    for (const campo of this.camposEvaluados) {
      const valor = e[campo.key];
      const vacio =
        valor === null ||
        valor === undefined ||
        (typeof valor === 'string' && valor.trim() === '') ||
        (typeof valor === 'string' && valor.toLowerCase() === 'no disponible');

      if (vacio) {
        faltantes.push(campo.label);
      } else {
        completos++;
      }
    }

    const progreso = Math.round((completos / this.camposEvaluados.length) * 100);
    return { ...e, progreso, faltantes };
  }

  iniciales(e: empresaResponse): string {
    const nombre = e.nombreLegal?.trim() ?? '';
    if (!nombre) return '?';
    const partes = nombre.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }

  tieneLogo(e: empresaResponse): boolean {
    const p = e.logoPath?.trim();
    if (!p) return false;
    return p.toLowerCase() !== 'no disponible';
  }

  colorProgreso(p: number): string {
    if (p >= 80) return 'ok';
    if (p >= 50) return 'mid';
    return 'low';
  }

  onLogoError(e: EmpresaConProgreso): void {
    e.logoPath = '';
    this.empresas.update((arr) =>
      arr.map((x) => (x.id === e.id ? { ...x, ...this.calcularProgreso(e) } : x))
    );
  }

  onCrearClick(): void {
    this.crear.emit();
  }

  onEmpresaClick(e: EmpresaConProgreso): void {
    this.editar.emit(e.id);
  }

  recargar(): void {
    this.cargarEmpresas();
  }
}