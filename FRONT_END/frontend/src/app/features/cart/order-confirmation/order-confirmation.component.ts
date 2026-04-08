import { Component, OnInit } from '@angular/core';
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

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.orderService.lastOrder$.subscribe(order => {
      if (!order) {
        this.router.navigate(['/orders']);
        return;
      }
      this.order = order;
    });
  }

  getImageUrl(imagePath: string | null): string {
    return this.productService.getImageUrl(imagePath);
  }

  getLineTotal(price: number, qty: number): number {
    return Number((price * qty).toFixed(2));
  }

  onContinueShopping(): void {
    this.orderService.clearLastOrder();
    this.router.navigate(['/']);
  }

  onViewOrders(): void {
    this.orderService.clearLastOrder();
    this.router.navigate(['/orders']);
  }
}
