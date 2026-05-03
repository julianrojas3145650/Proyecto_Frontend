import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <!-- Header Superior -->
    <header class="header-superior">
      <div class="header-left">
        <button class="btn-menu" (click)="toggleSidebar()">
          <i class="fas fa-bars"></i>
        </button>
        <h1>Sistema Avícola</h1>
      </div>
      <div class="header-right">
        <div class="user-card" (click)="toggleUserMenu()">
          <i class="fas fa-user"></i>
          <div class="user-info">
            <div class="user-name">{{ currentUser()?.nombre || 'Usuario' }}</div>
            <div class="user-role">{{ getUserRole() }}</div>
          </div>
          <i class="fas fa-chevron-down" style="font-size:1.2rem;margin-left:0.5rem"></i>
        </div>
        @if (showUserMenu()) {
          <div class="user-dropdown">
            <a [routerLink]="['/config/users']" (click)="showUserMenu.set(false)" class="dropdown-item">
              <i class="fas fa-user-cog"></i> Mi Perfil
            </a>
            <hr>
            <button (click)="logout()" class="dropdown-item text-danger">
              <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
            </button>
          </div>
        }
      </div>
    </header>

    <div class="main-container">
      <!-- Sidebar -->
      <aside class="sidebar" [class.hidden]="sidebarHidden()">
        <nav>
          <ul>
            @for (item of navItems; track item.route) {
              <li>
                <a [routerLink]="item.route" routerLinkActive="active" class="nav-link">
                  <i class="fas {{ item.icon }}"></i>
                  {{ item.label }}
                </a>
              </li>
            }
            <li>
              <button class="nav-link" style="width:100%;text-align:left;background:none;border:none" (click)="logout()">
                <i class="fas fa-sign-out-alt"></i>
                Cerrar Sesión
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- Page Content -->
      <main class="page-content" [class.sidebar-collapsed]="sidebarHidden()">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .user-dropdown {
      position: absolute;
      top: calc(var(--header-height) - 0.5rem);
      right: 1.5rem;
      background: white;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      z-index: 1001;
      min-width: 18rem;
      padding: 0.5rem 0;

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.2rem 1.8rem;
        font-size: 1.4rem;
        color: var(--text-dark);
        cursor: pointer;
        text-decoration: none;
        background: none;
        border: none;
        width: 100%;
        font-family: 'Work Sans', sans-serif;
        transition: background 0.2s;

        &:hover { background: var(--gray-light); }
        &.text-danger { color: var(--danger); }
      }

      hr { border: none; border-top: 1px solid var(--gray-medium); margin: 0.3rem 0; }
    }

    .header-right { position: relative; }
  `],
})
export class LayoutComponent {
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;
  sidebarHidden = signal(false);
  showUserMenu = signal(false);

  navItems: NavItem[] = [
    { label: 'Inicio', icon: 'fa-home', route: '/dashboard' },
    { label: 'Gestión de Gallinas', icon: 'fa-dove', route: '/flocks' },
    { label: 'Gestión de Huevos', icon: 'fa-egg', route: '/eggs' },
    { label: 'Gestión de Insumos', icon: 'fa-box', route: '/supplies' },
    { label: 'Reportes', icon: 'fa-chart-bar', route: '/reports' },
    { label: 'Configuración', icon: 'fa-cog', route: '/config' },
  ];

  toggleSidebar(): void { this.sidebarHidden.update((v) => !v); }
  toggleUserMenu(): void { this.showUserMenu.update((v) => !v); }

  getUserRole(): string {
    const user = this.currentUser();
    return user?.roles?.[0]?.nombre || 'Usuario';
  }

  logout(): void { this.authService.logout(); }
}
