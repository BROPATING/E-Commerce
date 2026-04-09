import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // 1. Import Router
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
  loading = true;

  // 2. Inject Router in constructor
  constructor(
    private adminService: AdminService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.adminService.getAllOrders().subscribe({
      next: (res: any) => {
        this.orders = res.orders || res || [];
        this.loading = false;
      },
      error: () => {
        this.orders = [];
        this.loading = false;
      }
    });
  }

  // 3. Update this method to navigate
  viewOrder(orderId: number): void {
    // This navigates to admin/orders/{id} relative to where you are now
    this.router.navigate([orderId], { relativeTo: this.route });
  }
}