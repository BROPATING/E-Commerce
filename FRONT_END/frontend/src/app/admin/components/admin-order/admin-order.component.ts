import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { Order } from '../../../shared/Interface';

@Component({
  selector: 'app-admin-order',
  standalone: false,
  templateUrl: './admin-order.component.html',
  styleUrl: './admin-order.component.css'
})
export class AdminOrderComponent implements OnInit {
  orders: Order[] = [];
  selectedOrder: Order | null = null;
  loading = true;

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.adminService.getAllOrders().subscribe({
      next: (res: any) => {
        // This check handles both wrapped {orders: []} and direct [] responses
        this.orders = res.orders || res || [];
        this.loading = false;
      },
      error: () => {
        this.orders = [];
        this.loading = false;
      }
    });
  }

  viewOrder(order: Order): void {
    this.selectedOrder = this.selectedOrder?.id === order.id ? null : order;
  }
}