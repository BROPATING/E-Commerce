import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Cart } from '../../../shared/Interface';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';

/**
 * CheckoutComponent
 * -----------------
 * Handles the checkout process including:
 * - Displaying cart items
 * - Selecting payment methods
 * - Placing an order
 * - Redirecting to confirmation or cart page
 */
@Component({
  selector: 'app-checkout',
  standalone: false,
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  form: FormGroup;
  cart: Cart = { items: [], total: 0 };
  loading = false;
  pageLoading = true;
  errorMessage = '';

  readonly paymentMethods = [
    { value: 'Credit Card',      label: 'Credit Card',      icon: '💳' },
    { value: 'Debit Card',       label: 'Debit Card',       icon: '🏦' },
    { value: 'Cash on Delivery', label: 'Cash on Delivery', icon: '💵' },
    { value: 'Bank Transfer',    label: 'Bank Transfer',    icon: '🔄' },
  ];

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private productService: ProductService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      paymentMethod: ['', Validators.required],
    });
  }

  /**
   * Lifecycle hook: OnInit
   * - Subscribes to cart updates
   * - Loads cart data
   * - Redirects to cart page if empty
   */
  ngOnInit(): void {
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart ?? { items: [], total: 0 };
    });

    this.cartService.loadCart().subscribe({
      next: cart => {
        this.pageLoading = false;
        if (!cart.items || cart.items.length === 0) {
          this.router.navigate(['/cart']);
        }
      },
      error: () => {
        this.pageLoading = false;
        this.router.navigate(['/cart']);
      }
    });
  }
  /** Getter for payment method form control */
  get paymentMethod() { return this.form.get('paymentMethod')!; }

  /**
   * Utility: Get product image URL
   * @param imagePath relative path or null
   */
  getImageUrl(imagePath: string | null): string {
    return this.productService.getImageUrl(imagePath);
  }

  /**
   * Select a payment method programmatically
   * @param value chosen payment method
   */
  selectMethod(value: string): void {
    this.form.patchValue({ paymentMethod: value });
  }

  /**
   * Place order
   * - Validates form
   * - Calls checkout service
   * - Clears cart on success
   * - Handles error messages
   */
  onPlaceOrder(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    this.errorMessage = '';

    this.orderService.checkout(this.paymentMethod.value).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.router.navigate(['/cart/confirmation']);
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Checkout failed. Please try again.';
      }
    });
  }
}
