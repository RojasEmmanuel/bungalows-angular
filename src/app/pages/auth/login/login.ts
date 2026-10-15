import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../services/auth.service'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly anioActual = new Date().getFullYear();

  username = signal('');
  password = signal('');
  mostrarPassword = signal(false);
  cargando = signal(false);
  error = signal<string | null>(null);

  /** Permite enviar con Enter desde cualquier input */
  onSubmit(): void {
    const user = this.username().trim();
    const pass = this.password();

    if (!user || !pass) {
      this.error.set('Ingresa usuario y contraseña.');
      return;
    }

    if (this.cargando()) return;

    this.cargando.set(true);
    this.error.set(null);

    this.auth.login({ username: user, password: pass }).subscribe({
      next: () => {
        this.cargando.set(false);
        // Navega al home (o a la ruta que quieras por defecto)
        this.router.navigate(['/']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando.set(false);
        if (err.status === 401) {
          this.error.set('Usuario o contraseña incorrectos.');
        } else if (err.status === 0) {
          this.error.set('Sin conexión con el servidor.');
        } else {
          this.error.set(err?.error?.message ?? 'No se pudo iniciar sesión.');
        }
      },
    });
  }

  togglePassword(): void {
    this.mostrarPassword.update((v) => !v);
  }
}