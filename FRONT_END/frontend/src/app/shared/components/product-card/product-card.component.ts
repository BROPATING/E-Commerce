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
  /**
   * Product data passed into the component.
   * Required input of type Product.
   */
  @Input() product!: Product;
  /**
   * Flag to control visibility of "Add to Cart" button.
   * Defaults to false.
   */
  @Input() showAddToCart = false;
  /**
   * Event emitter that notifies parent components
   * when a product is added to the cart.
   * Emits the product ID.
   */
  @Output() addToCart = new EventEmitter<number>();

  /**
   * Injects ProductService to handle product-related operations.
   */
  constructor(private productService: ProductService) {}

  /**
   * Getter: Returns the full image URL for the product.
   * Uses ProductService to resolve the image path.
   */
  get imageUrl(): string {
    return this.productService.getImageUrl(this.product.imagePath);
  }

  /**
   * Handles "Add to Cart" action.
   * Emits the product ID to parent components.
   */
  onAddToCart(): void {
    this.addToCart.emit(this.product.id);
  }
}
