import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ProductService } from '../../../core/services/product.service';
import { Order } from '../../../shared/Interface';
import { FormBuilder } from '@angular/forms';

/**
 * AdminOrderDetailComponent
 * -------------------------
 * Displays detailed information about a specific order in the admin panel:
 * - Fetches order details by ID
 * - Handles loading and error states
 * - Provides utility methods for totals and navigation
 */
@Component({
  selector: 'app-admin-order-detail',
  standalone: false,
  templateUrl: './admin-order-detail.component.html',
  styleUrls: ['./admin-order-detail.component.css'],
})
export class AdminOrderDetailComponent implements OnInit {
  /** Current order being viewed */
  order: Order | null = null;

  /** Loading flag for data fetch */
  loading = true;

  /** Error message displayed on failure */
  errorMessage = '';

  /** Injected services */
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  /**
   * Lifecycle hook: OnInit
   * - Reads order ID from route
   * - Validates ID
   * - Fetches order details
   */
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (isNaN(id) || id <= 0) {
        this.router.navigate(['/admin/orders']);
        return;
      }

      this.fetchOrder(id);
    });
  }

  /**
   * Fetch order details from backend
   * @param id order identifier
   */
  fetchOrder(id: number): void {
    this.loading      = true;
    this.errorMessage = '';

    this.adminService.getOrderDetail(id).subscribe({
      next: res => {
        // Some APIs may return { order } while others return the order directly
        this.order   = (res as any).order ?? res;
        this.loading = false;
      },
      error: err => {
        this.errorMessage = err.status === 404
          ? 'Order not found.'
          : 'Could not load order. Please try again.';
        this.loading = false;
      }
    });
  }

  /**
   * Utility: Get product image URL
   * @param imagePath relative path or null
   */
  getImageUrl(imagePath: string | null): string {
    return this.productService.getImageUrl(imagePath);
  }

  /**
   * Calculate line total for an item
   * @param price unit price
   * @param qty quantity
   * @returns line total rounded to 2 decimals
   */
  getLineTotal(price: number, qty: number): number {
    return Number((price * qty).toFixed(2));
  }

  /**
   * Calculate total number of items in order
   */
  getTotalItems(): number {
    return this.order?.items?.reduce(
      (sum, item) => sum + item.quantity, 0
    ) ?? 0;
  }

  /**
   * Navigate back to orders list
   */
  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }
}