import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Prevents logged-in users from accessing login/register pages.
 * Redirects them to homepage instead.
 */
@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {

  private authService = inject(AuthService);
  private router = inject(Router);
  
  canActivate(): boolean {
    if (!this.authService.isLoggedIn) return true;
    this.router.navigate(['/']);
    return false;
  }
}