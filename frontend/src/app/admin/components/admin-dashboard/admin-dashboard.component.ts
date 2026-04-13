import { Component, HostListener, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

/**
 * AdminDashboardComponent
 * -----------------------
 * Provides the main entry point for the admin dashboard:
 * - Displays admin-specific controls and overview
 * - Handles logout functionality
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  sidebarOpen = false;
  /** Injected authentication service */
  private authService = inject(AuthService);

  /**
   * Logout current admin user
   * - Calls AuthService.logout
   * - Backend clears session/token
   * - UI should redirect via route guard or observable subscription
   */
  onLogout(): void {
    this.sidebarOpen = false;
    this.authService.logout().subscribe();
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 768) {
      this.sidebarOpen = false;
    }
  }
}