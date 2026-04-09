import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService} from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../shared/Interface';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = true;
  errorMessage = '';
  quantity = 1;
  cartMessage = '';
  cartSuccess = false;
  addingToCart = false;
  shareSuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    // We subscribe to paramMap so if the ID changes, the data reloads
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));

      if (isNaN(id) || id <= 0) {
        this.router.navigate(['/products']);
        return;
      }

      this.loadProduct(id);
    });
  }

  loadProduct(id: number): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.productService.getProductById(id).subscribe({
      next: res => {
        // Fix: res.product handles the object wrapper, res handles direct objects
        this.product = res.product || res; 
        this.loading = false;
        this.quantity = 1;
      },
      error: err => {
        console.error('Error fetching product:', err);
        this.errorMessage = err.status === 404
          ? 'This product could not be found.'
          : 'Could not load product. Please try again.';
        this.loading = false;
      }
    });
  }

  get imageUrl(): string {
    return this.productService.getImageUrl(this.product?.imagePath ?? null);
  }

  get isOutOfStock(): boolean {
    return (this.product?.stock ?? 0) === 0;
  }

  get isLowStock(): boolean {
    const s = this.product?.stock ?? 0;
    return s > 0 && s <= 5;
  }

  increment(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decrement(): void {
    if (this.quantity > 1) this.quantity--;
  }

  onAddToCart(): void {
    if (!this.product || this.addingToCart) return;
    this.addingToCart = true;
    this.cartMessage = '';

    this.cartService.addToCart(this.product.id, this.quantity).subscribe({
      next: () => {
        this.addingToCart = false;
        this.cartSuccess = true;
        this.cartMessage = `${this.quantity} item${this.quantity > 1 ? 's' : ''} added to cart!`;
        setTimeout(() => {
          this.cartSuccess = false;
          this.cartMessage = '';
        }, 3000);
      },
      error: err => {
        this.addingToCart = false;
        this.cartSuccess = false;
        this.cartMessage = err.error?.error || 'Could not add to cart.';
      }
    });
  }

  onShare(): void {
    const url  = window.location.href;
    const name = this.product?.name ?? 'product';

    if (navigator.share) {
      navigator.share({
        title: name,
        text:  `Check out ${name} on ShopNow`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.shareSuccess = true;
        setTimeout(() => { this.shareSuccess = false; }, 2500);
      }).catch(() => {
        prompt('Copy this link to share:', url);
      });
    }
  }

  browseType(typeId: number | undefined): void {
    if (typeId === undefined) return;
    this.router.navigate(['/products'], { queryParams: { typeId } });
  }

  browseCategory(categoryId: number | undefined): void {
    if (categoryId === undefined) return;
    this.router.navigate(['/products'], { queryParams: { categoryId } });
  }

  browseSubCategory(subCategoryId: number | undefined): void {
    if (subCategoryId === undefined) return;
    this.router.navigate(['/products'], { queryParams: { subCategoryId } });
  }
}