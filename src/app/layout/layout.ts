import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: 'home' | 'users' | 'document' | 'beach' | 'money';
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
})
export class LayoutComponent {
  readonly navItems = signal<NavItem[]>([
    { label: 'Inicio',        route: '/inicio',        icon: 'home'     },
    { label: 'Colaboradores', route: '/colaboradores', icon: 'users'    },
    { label: 'Nóminas',       route: '/nominas',       icon: 'document' },
    { label: 'Vacaciones',    route: '/vacaciones',    icon: 'beach' },
    { label: 'Préstamos',      route: '/prestamos',    icon: 'money' },
  ]);

  readonly user = signal({
    name: 'Emma Dev',
    role: 'Administrador',
    avatar: 'https://avatars.githubusercontent.com/u/20044882?v=4',
  });
}