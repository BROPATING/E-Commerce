import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product, TaxonomyType } from '../../../shared/Interface';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  taxonomy: TaxonomyType[] = [];
  pagination = { total: 0, page: 1, limit: 12, totalPages: 0 };
  loading = false;
  filterForm: FormGroup;
  cartSuccessId: number | null = null;
  private paramsSub!: Subscription;
  private searchSub!: Subscription;

  // ADD THESE TWO LINES:
  sidebarOpen = false; // Fixes the "Property does not exist" error

  /**
   * Inject required services:
   * - ProductService: fetches products and taxonomy
   * - CartService: manages cart operations
   * - AuthService: provides authentication state
   * - ActivatedRoute: reads query parameters
   * - Router: handles navigation
   * - FormBuilder: builds reactive forms
   */
  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      typeId: [''],
      categoryId: [''],
      subCategoryId: [''],
      minPrice: [''],
      maxPrice: [''],
      inStock: [false],
    });
  }

  /**
   * Lifecycle hook: Initializes component state.
   * Loads taxonomy and reacts to query parameter changes.
   */
  ngOnInit(): void {
    // Step 1 — load taxonomy for the filter dropdowns
    this.productService.getTaxonomy().subscribe({
      next: res => { this.taxonomy = res.taxonomy ?? []; },
      error: () => { }
    });

    // Step 2 — subscribe to URL query params
    // This fires on EVERY navigation: /products?categoryId=2, ?typeId=1, ?search=phone
    this.route.queryParams.subscribe(params => {

      // Patch the filter form with whatever params are in the URL
      this.filterForm.patchValue({
        search: params['search'] || '',
        typeId: params['typeId'] || '',
        categoryId: params['categoryId'] || '',
        subCategoryId: params['subCategoryId'] || '',
        minPrice: params['minPrice'] || '',
        maxPrice: params['maxPrice'] || '',
        inStock: params['inStock'] === 'true' ? true : false,
      }, { emitEvent: false });

      // Reset to page 1 on every new filter navigation
      this.pagination.page = params['page'] ? Number(params['page']) : 1;
      // Immediately load products with those filters
      this.loadProducts();
    });
  }

  /**
   * Lifecycle hook: Cleans up subscriptions on destroy.
   */
  ngOnDestroy(): void {
    this.paramsSub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  /**
   * Loads products based on current filter form values and pagination.
   */
  loadProducts(): void {
    this.loading = true;

    const v = this.filterForm.value;

    const query: any = {
      page: this.pagination.page,
      limit: 12,
    };

    // Only add params that have actual values
    if (v.search) query.search = v.search.trim();
    if (v.typeId) query.typeId = v.typeId;
    if (v.categoryId) query.categoryId = v.categoryId;
    if (v.subCategoryId) query.subCategoryId = v.subCategoryId;
    if (v.minPrice) query.minPrice = v.minPrice;
    if (v.maxPrice) query.maxPrice = v.maxPrice;
    if (v.inStock) query.inStock = true;

    this.productService.getProducts(query).subscribe({
      next: res => {
        this.products = res.products ?? [];
        this.pagination = res.pagination ?? this.pagination;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  /**
   * Applies filters by updating query parameters.
   */
  applyFilters(): void {
    const v = this.filterForm.value;
    const queryParams: any = {};

    if (v.search) queryParams.search = v.search.trim();
    if (v.typeId) queryParams.typeId = v.typeId;
    if (v.categoryId) queryParams.categoryId = v.categoryId;
    if (v.subCategoryId) queryParams.subCategoryId = v.subCategoryId;
    if (v.minPrice) queryParams.minPrice = v.minPrice;
    if (v.maxPrice) queryParams.maxPrice = v.maxPrice;
    if (v.inStock) queryParams.inStock = true;

    // Navigate with new params — this triggers queryParams.subscribe above
    this.router.navigate(['/products'], { queryParams });
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '', typeId: '', categoryId: '',
      subCategoryId: '', minPrice: '', maxPrice: '', inStock: false
    });
    this.router.navigate(['/products']);
  }

  /**
   * Navigates to a specific page in pagination.
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.pagination.totalPages) return;
    this.router.navigate(['/products'], {
      queryParams: {
        ...this.route.snapshot.queryParams,
        page,
      },
    });
  }

  /**
   * Adds a product to the cart.
   * Shows a temporary success indicator on the product card.
   */
  onAddToCart(productId: number): void {
    this.cartService.addToCart(productId, 1).subscribe({
      next: () => {
        this.cartSuccessId = productId;
        setTimeout(() => { this.cartSuccessId = null; }, 2000);
      },
      error: err => alert(err.error?.error || 'Could not add to cart')
    });
  }

  /**
   * Generates page numbers for pagination display.
   * Includes ellipsis (-1) for skipped ranges.
   */
  get pageNumbers(): number[] {
    const total = this.pagination.totalPages;
    const current = this.pagination.page;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    // Show sliding window of pages
    const pages: number[] = [1];
    if (current > 3) pages.push(-1); // ellipsis
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push(-1); // ellipsis
    pages.push(total);
    return pages;
  }

  /** Counts active filters applied by the user */
  get activeFilterCount(): number {
    const v = this.filterForm.value;
    return [v.search, v.typeId, v.categoryId, v.subCategoryId,
    v.minPrice, v.maxPrice, v.inStock]
      .filter(Boolean).length;
  }

  /** Returns a label describing current search/filter context */
  get currentSearchLabel(): string {
    const params = this.route.snapshot.queryParams;
    if (params['search']) return `Results for "${params['search']}"`;
    if (params['subCategoryId']) return 'Sub-category products';
    if (params['categoryId']) return 'Category products';
    if (params['typeId']) return 'Type products';
    return 'All Products';
  }

  /** Returns a label describing current search/filter context */
  get skeletons(): number[] {
    return Array.from({ length: 12 }, (_, i) => i);
  }
}