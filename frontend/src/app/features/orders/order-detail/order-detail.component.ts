import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { Order } from '../../../shared/Interface';

@Component({
  selector: 'app-order-detail',
  standalone: false,
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css'],
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  errorMessage = '';
  isAdminView = false; // Added this to support your template logic

  private route          = inject(ActivatedRoute);
  private router         = inject(Router);
  private orderService   = inject(OrderService);
  private productService = inject(ProductService);

  /**
   * Lifecycle hook: Initializes component state.
   * Detects admin view and subscribes to route parameter changes.
   */
  ngOnInit(): void {
    // Detect if we are in admin mode based on URL
    this.isAdminView = this.router.url.includes('/admin/');

    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (isNaN(id) || id <= 0) {
        this.goBack();
        return;
      }
      this.fetchOrder(id);
    });
  }

  /**
   * Fetches order details by ID.
   * Handles both success and error states.
   */
  fetchOrder(id: number): void {
    this.loading = true;
    this.orderService.getOrderById(id).subscribe({
      next: res => {
        this.order = res.order || res;
        this.loading = false;
      },
      error: err => {
        this.errorMessage = err.status === 404 ? 'Order not found.' : 'Could not load order.';
        this.loading = false;
      }
    });
  }

  /**
   * Returns the product image URL.
   * Handles potential null or undefined paths.
   */
  getImageUrl(imagePath: string | null): string {
    // Fixed: Handles potential undefined from template
    return this.productService.getImageUrl(imagePath ?? null);
  }

  /**
   * Calculates line total for a product row.
   * @param price - Unit price of the product
   * @param qty - Quantity ordered
   */
  getLineTotal(price: number, qty: number): number {
    return Number((price * qty).toFixed(2));
  }

  /**
   * Calculates total number of items in the order.
   */
  getTotalItems(): number {
    return this.order?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  }

  /**
   * Navigates back to the appropriate orders list.
   * Redirects to admin orders if in admin view, otherwise to user orders.
   */
  goBack(): void {
    const target = this.isAdminView ? '/admin/orders' : '/orders';
    this.router.navigate([target]);
  }
}