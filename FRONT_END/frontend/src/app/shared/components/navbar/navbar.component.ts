import { Component, inject, OnInit, HostListener } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  currentUser: any = null;
  cartCount   = 0;
  searchQuery = '';
  mobileOpen  = false;

  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router      = inject(Router);

  /**
   * Lifecycle hook: Initializes component state.
   * Subscribes to authentication and cart observables
   * to keep the navbar updated with user and cart info.
   */
  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.role === 'customer') {
        this.cartService.loadCart().subscribe();
      }
    });

    this.cartService.cart$.subscribe(cart => {
      this.cartCount = cart?.items?.reduce(
        (sum, item) => sum + item.quantity, 0
      ) ?? 0;
    });
  }

  /**
   * HostListener: Handles window resize events.
   * Ensures mobile menu closes automatically
   * when switching to desktop view.
   */
  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 768) this.mobileOpen = false;
  }

  /**
   * Executes product search based on user query.
   * Navigates to the products page with search parameters.
   */
  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], {
        queryParams: { search: this.searchQuery.trim() }
      });
    }
  }
  /**
   * Logs out the current user.
   * Closes the mobile menu and triggers logout process.
   */
  onLogout(): void {
    this.mobileOpen = false;
    this.authService.logout().subscribe();
  }
}