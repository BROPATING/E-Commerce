import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Router + ActivatedRoute for navigation
import { AdminService } from '../../../core/services/admin.service';
import { Order } from '../../../shared/Interface';

/**
 * AdminOrderComponent
 * -------------------
 * Displays a list of all orders in the admin panel:
 * - Fetches orders from backend
 * - Handles loading and error states
 * - Provides navigation to order detail view
 */
@Component({
  selector: 'app-admin-order',
  standalone: false,
  templateUrl: './admin-order.component.html',
  styleUrl: './admin-order.component.css'
})
export class AdminOrderComponent implements OnInit {
  orders: Order[] = [];

  loading = true;

  /** Injected services */
  private adminService = inject(AdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    // Fetch all orders on initialization
    this.adminService.getAllOrders().subscribe({
      next: (res: any) => {
        // Some APIs may return { orders }, others may return array directly
        this.orders = res.orders || res || [];
        this.loading = false;
      },
      error: () => {
        this.orders = [];
        this.loading = false;
      }
    });
  }

  /**
   * Navigate to order detail view
   */
  viewOrder(orderId: number): void {
    this.router.navigate([orderId], { relativeTo: this.route });
  }

  trackByIndex(index: number):number{
    return index;
  }
}