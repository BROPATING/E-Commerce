import { Component, inject, OnInit } from '@angular/core';
import { User } from '../../Interface';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  cartCount = 0;
  searchQuery = '';

  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user?.role === 'customer') {
        this.cartService.loadCart().subscribe();
      }
    });

    this.cartService.cart$.subscribe(cart => {
      this.cartCount = cart.items.reduce(
        (sum, item) => sum + item.quantity, 0
      );
    });
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], {
        queryParams: { search: this.searchQuery.trim() }
      });
    }
  }

  onLogout(): void {
    this.authService.logout().subscribe();
  }
}
