import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../Interface';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-card',
  standalone: false,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() showAddToCart = false;
  @Output() addToCart = new EventEmitter<number>();

  constructor(private productService: ProductService) {}

  get imageUrl(): string {
    return this.productService.getImageUrl(this.product.imagePath);
  }

  onAddToCart(): void {
    this.addToCart.emit(this.product.id);
  }
}
