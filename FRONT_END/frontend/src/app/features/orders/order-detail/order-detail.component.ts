import { Component, OnInit } from '@angular/core';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private productService: ProductService,
  ) {}

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

  getImageUrl(imagePath: string | null): string {
    // Fixed: Handles potential undefined from template
    return this.productService.getImageUrl(imagePath ?? null);
  }

  getLineTotal(price: number, qty: number): number {
    return Number((price * qty).toFixed(2));
  }

  getTotalItems(): number {
    return this.order?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  }

  goBack(): void {
    const target = this.isAdminView ? '/admin/orders' : '/orders';
    this.router.navigate([target]);
  }
}