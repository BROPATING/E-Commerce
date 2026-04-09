import { Component, OnDestroy, OnInit } from '@angular/core';
import { Cart } from '../../../shared/Interface';
import { Subscription } from 'rxjs';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart-page',
  standalone: false,
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.css'
})
export class CartPageComponent implements OnInit, OnDestroy {
  cart: Cart = { items: [], total: 0 };
  loading = true;
  updatingItems = new Set<number>(); // tracks which items are being updated
  private cartSub!: Subscription;

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Subscribe to cart state changes
    this.cartSub = this.cartService.cart$.subscribe(cart => {
      this.cart = cart ?? { items: [], total: 0 };
    });

    // Load fresh cart from backend
    this.cartService.loadCart().subscribe({
      next: () => { this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
  }

  getImageUrl(imagePath: string | null): string {
    return this.productService.getImageUrl(imagePath);
  }

  increment(productId: number, currentQty: number, stock: number): void {
    if (currentQty >= stock) return;
    this.updateQuantity(productId, currentQty + 1);
  }

  decrement(productId: number, currentQty: number): void {
    if (currentQty <= 1) return;
    this.updateQuantity(productId, currentQty - 1);
  }

  updateQuantity(productId: number, quantity: number): void {
    this.updatingItems.add(productId);
    this.cartService.updateItem(productId, quantity).subscribe({
      next: () => { this.updatingItems.delete(productId); },
      error: err => {
        this.updatingItems.delete(productId);
        alert(err.error?.error || 'Could not update quantity');
      }
    });
  }

  removeItem(productId: number): void {
    this.updatingItems.add(productId);
    this.cartService.removeItem(productId).subscribe({
      next: () => { this.updatingItems.delete(productId); },
      error: err => {
        this.updatingItems.delete(productId);
        alert(err.error?.error || 'Could not remove item');
      }
    });
  }

  isUpdating(productId: number): boolean {
    return this.updatingItems.has(productId);
  }

  proceedToCheckout(): void {
    this.router.navigate(['/cart/checkout']);
  }

  getLineTotal(price: number, qty: number): number {
    return Number((price * qty).toFixed(2));
  }
}
