import { Component, inject, OnInit } from '@angular/core';
import { OrderService} from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { Order } from '../../../shared/Interface';

@Component({
  selector: 'app-order-list',
  standalone: false,
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css'],
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  errorMessage = '';

  private orderService = inject(OrderService);
  private productService = inject(ProductService);

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
      next: res => {
        this.orders = res.orders ?? [];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load your orders. Please try again.';
        this.loading = false;
      }
    });
  }

  getImageUrl(imagePath: string | null): string {
    return this.productService.getImageUrl(imagePath);
  }

  /**
   * Returns the first 2 items from an order for the preview thumbnails.
   * The rest are counted and shown as "+N more".
   */
  getPreviewItems(order: Order) {
    return order.items?.slice(0, 2) ?? [];
  }

  getRemainingCount(order: Order): number {
    const total = order.items?.length ?? 0;
    return total > 2 ? total - 2 : 0;
  }

  getLineTotal(price: number, qty: number): number {
    return Number((price * qty).toFixed(2));
  }

  getItemCount(order: Order): number {
    return order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  }

  trackByIndex(index: number):number{
    return index;
  }
}