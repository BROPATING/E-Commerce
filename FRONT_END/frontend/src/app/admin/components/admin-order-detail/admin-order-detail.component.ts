import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ProductService } from '../../../core/services/product.service';
import { Order } from '../../../shared/Interface';

@Component({
  selector: 'app-admin-order-detail',
  standalone: false,
  templateUrl: './admin-order-detail.component.html',
  styleUrls: ['./admin-order-detail.component.css'],
})
export class AdminOrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading      = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminService: AdminService,
    private productService: ProductService,
  ) {}

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

  fetchOrder(id: number): void {
    this.loading      = true;
    this.errorMessage = '';

    this.adminService.getOrderDetail(id).subscribe({
      next: res => {
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

  getImageUrl(imagePath: string | null): string {
    return this.productService.getImageUrl(imagePath);
  }

  getLineTotal(price: number, qty: number): number {
    return Number((price * qty).toFixed(2));
  }

  getTotalItems(): number {
    return this.order?.items?.reduce(
      (sum, item) => sum + item.quantity, 0
    ) ?? 0;
  }

  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }
}