import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService} from '../../../core/services/order.service';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private productService: ProductService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (isNaN(id) || id <= 0) {
      this.router.navigate(['/orders']);
      return;
    }

    this.orderService.getOrderById(id).subscribe({
      next: res => {
        this.order = res.order;
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
    this.router.navigate(['/orders']);
  }
}