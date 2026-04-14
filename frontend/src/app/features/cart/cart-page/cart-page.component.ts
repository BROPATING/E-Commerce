import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Cart } from '../../../shared/Interface';
import { Subscription } from 'rxjs';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
/**
 * CartPageComponent
 * -----------------
 * Responsible for displaying and managing the shopping cart.
 * Features:
 * - Shows cart items and totals
 * - Allows quantity updates and item removal
 * - Handles loading and update states
 * - Navigates to checkout
 */
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

  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  /**
   * Lifecycle hook: OnInit
   * - Subscribes to cart state changes
   * - Loads cart data from backend
   */
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

  /**
   * Lifecycle hook: OnDestroy
   * - Unsubscribes from cart observable to prevent memory leaks
   */
  ngOnDestroy(): void {
    this.cartSub?.unsubscribe();
  }

  getImageUrl(imagePath: string | null): string {
    return this.productService.getImageUrl(imagePath);
  }

  /**
   * Increment item quantity by 1
   * @param productId product identifier
   * @param currentQty current quantity
   * @param stock available stock
   */
  increment(productId: number, currentQty: number, stock: number): void {
    if (currentQty >= stock) return;
    this.updateQuantity(productId, currentQty + 1);
  }

  /**
   * Decrement item quantity by 1
   * @param productId product identifier
   * @param currentQty current quantity
   */
  decrement(productId: number, currentQty: number): void {
    if (currentQty <= 1) return;
    this.updateQuantity(productId, currentQty - 1);
  }

  /**
   * Update item quantity in cart
   * @param productId product identifier
   * @param quantity new quantity
   */
  // updateQuantity(productId: number, quantity: number): void {
  //   this.updatingItems.add(productId);
  //   this.cartService.updateItem(productId, quantity).subscribe({
  //     next: () => { this.updatingItems.delete(productId); },
  //     error: err => {
  //       this.updatingItems.delete(productId);
  //       alert(err.error?.error || 'Could not update quantity');
  //     }
  //   });
  // }
  updateQuantity(productId: number, quantity: number): void {
    this.updatingItems.add(productId);
    this.cartService.updateItem(productId, quantity).subscribe({
      next: () => { 
        this.updatingItems.delete(productId); 
        // Optional: Toast notification for success
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: 'Quantity updated' });
      },
      error: err => {
        this.updatingItems.delete(productId);
        // 2. Error Alert
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: err.error?.error || 'Could not update quantity',
          confirmButtonColor: '#06b6d4'
        });
      }
    });
  }

  /**
   * Remove item from cart
   * @param productId product identifier
   */
  // removeItem(productId: number): void {
  //   this.updatingItems.add(productId);
  //   this.cartService.removeItem(productId).subscribe({
  //     next: () => { this.updatingItems.delete(productId); },
  //     error: err => {
  //       this.updatingItems.delete(productId);
  //       alert(err.error?.error || 'Could not remove item');
  //     }
  //   });
  // }
  removeItem(productId: number): void {
    // 3. Confirmation Dialog
    Swal.fire({
      title: 'Remove item?',
      text: "Are you sure you want to remove this product from your cart?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#06b6d4',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.updatingItems.add(productId);
        this.cartService.removeItem(productId).subscribe({
          next: () => { 
            this.updatingItems.delete(productId);
            Swal.fire({
              title: 'Removed!',
              text: 'The item has been removed.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: err => {
            this.updatingItems.delete(productId);
            Swal.fire('Error', 'Could not remove item', 'error');
          }
        });
      }
    });
  }

  /**
   * Check if item is currently being updated
   * @param productId product identifier
   */
  isUpdating(productId: number): boolean {
    return this.updatingItems.has(productId);
  }
  /**
   * Navigate to checkout page
   */
  proceedToCheckout(): void {
    this.router.navigate(['/cart/checkout']);
  }

  /**
   * Calculate line total for item
   * @param price unit price
   * @param qty quantity
   * @returns line total rounded to 2 decimals
   */
  getLineTotal(price: number, qty: number): number {
    return Number((price * qty).toFixed(2));
  }
}
