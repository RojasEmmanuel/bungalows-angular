import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../services/auth.service'; 
import { ConfirmModalComponent } from '../components/confirm-modal/confirm-modal'; 

interface NavItem {
  label: string;
  route: string;
  icon: 'home' | 'users' | 'document' | 'beach' | 'money' | 'calendar';
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    ConfirmModalComponent,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class LayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly navItems = signal<NavItem[]>([
    { label: 'Inicio',        route: '/inicio',        icon: 'home'     },
    { label: 'Colaboradores', route: '/colaboradores', icon: 'users'    },
    { label: 'Nóminas',       route: '/nominas',       icon: 'document' },
    { label: 'Vacaciones',    route: '/vacaciones',    icon: 'beach'    },
    { label: 'Aniversarios',  route: '/aniversarios',  icon: 'calendar' },
    { label: 'Préstamos',     route: '/prestamos',     icon: 'money'    },
  ]);

  /** Usuario real desde el AuthService */
  readonly user = this.auth.usuario;

  /** Iniciales para el avatar fallback */
  readonly inicialesUsuario = computed(() => {
    const nombre = this.user()?.nombre?.trim() ?? '';
    if (!nombre) return '?';
    const partes = nombre.split(/\s+/).filter(Boolean);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[1][0]).toUpperCase();
  });

  // ---------- Sidebar (mobile) ----------
  sidebarAbierto = signal(false);

  toggleSidebar(): void {
    this.sidebarAbierto.update((v) => !v);
  }

  cerrarSidebar(): void {
    this.sidebarAbierto.set(false);
  }

  // ---------- Logout ----------
  modalLogoutAbierto = signal(false);
  cerrandoSesion = signal(false);

  abrirModalLogout(): void {
    this.modalLogoutAbierto.set(true);
  }

  cerrarModalLogout(): void {
    if (this.cerrandoSesion()) return;
    this.modalLogoutAbierto.set(false);
  }

  confirmarLogout(): void {
    if (this.cerrandoSesion()) return;

    this.cerrandoSesion.set(true);

    this.auth.logout().subscribe({
      next: () => {
        this.cerrandoSesion.set(false);
        this.modalLogoutAbierto.set(false);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al cerrar sesión', err);
        // Aunque falle el backend, limpiamos estado local y redirigimos
        this.cerrandoSesion.set(false);
        this.modalLogoutAbierto.set(false);
        this.router.navigate(['/login']);
      },
    });
  }
}