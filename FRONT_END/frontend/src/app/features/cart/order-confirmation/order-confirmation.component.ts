import { Component, inject, OnInit } from '@angular/core';
import { Order } from '../../../shared/Interface';
import { ProductService } from '../../../core/services/product.service';
import { Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-order-confirmation',
  standalone: false,
  templateUrl: './order-confirmation.component.html',
  styleUrl: './order-confirmation.component.css'
})
export class OrderConfirmationComponent implements OnInit {
  order: Order | null = null;

  private readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  /**
   * Lifecycle hook: Initializes component state.
   * Subscribes to the last order observable and redirects if no order exists.
   */
  ngOnInit(): void {
    this.orderService.lastOrder$.subscribe(order => {
      if (!order) {
        this.router.navigate(['/orders']);
        return;
      }
      this.order = order;
    });
  }

  /**
   * Returns the product image URL.
   * Handles potential null or undefined paths.
   */
  getImageUrl(imagePath: string | null): string {
    return this.productService.getImageUrl(imagePath);
  }

  /**
   * Calculates line total for a product row.
   * @param price - Unit price of the product
   * @param qty - Quantity ordered
   * @returns Line total as a number
   */
  getLineTotal(price: number, qty: number): number {
    return Number((price * qty).toFixed(2));
  }

  /**
   * Clears the last order and navigates back to the home page.
   */
  onContinueShopping(): void {
    this.orderService.clearLastOrder();
    this.router.navigate(['/']);
  }

  /**
   * Clears the last order and navigates to the orders list.
   */
  onViewOrders(): void {
    this.orderService.clearLastOrder();
    this.router.navigate(['/orders']);
  }
}
