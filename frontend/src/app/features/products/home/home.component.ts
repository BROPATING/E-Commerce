import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product, TaxonomyType } from '../../../shared/Interface';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  taxonomy: TaxonomyType[] = [];
  loading = true;
  searchQuery = '';
  cartSuccessId: number | null = null;

  constructor(
    public productService: ProductService,
    private cartService: CartService,
    public authService: AuthService,
    private router: Router,
  ) {}

  /**
   * Lifecycle hook: Initializes component state.
   * Loads featured products and taxonomy data on component creation.
   */
  ngOnInit(): void {
    // Load featured products — latest 8
    this.productService.getProducts({ limit: 8, page: 1 }).subscribe({
      next: res => {
        this.featuredProducts = res.products ?? [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });

    // Load taxonomy for the browse section
    this.productService.getTaxonomy().subscribe({
      next: res => { this.taxonomy = res.taxonomy ?? []; },
      error: () => {}
    });
  }

  /**
   * Executes product search based on user query.
   * Navigates to products page with search parameters.
   */
  onSearch(): void {
    const q = this.searchQuery.trim();
    if (!q) return;
    this.router.navigate(['/products'], {
      queryParams: { search: q }
    });
  }

  /**
   * Adds a product to the cart.
   * Shows a temporary success indicator on the product card.
   */
  onAddToCart(productId: number): void {
    this.cartService.addToCart(productId, 1).subscribe({
      next: () => {
        // Flash a success indicator on the card
        this.cartSuccessId = productId;
        setTimeout(() => { this.cartSuccessId = null; }, 2000);
      },
      error: err => alert(err.error?.error || 'Could not add to cart')
    });
  }

  browseByType(typeId: number): void {
    this.router.navigate(['/products'], { queryParams: { typeId } });
  }

  browseByCategory(event: MouseEvent, categoryId: number): void {
    event.stopPropagation();
    this.router.navigate(['/products'], { queryParams: { categoryId } });
  }

  browseBySubCategory(event: MouseEvent, subCategoryId: number): void {
    event.stopPropagation();
    this.router.navigate(['/products'], { queryParams: { subCategoryId } });
  }

  get skeletons(): number[] {
    return Array.from({ length: 8 }, (_, i) => i);
  }

  trackByIndex(index: number):number{
    return index;
  }
}