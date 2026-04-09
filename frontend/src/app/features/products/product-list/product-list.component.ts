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

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
  ) {
    this.filterForm = this.fb.group({
      search:        [''],
      typeId:        [''],
      categoryId:    [''],
      subCategoryId: [''],
      minPrice:      [''],
      maxPrice:      [''],
      inStock:       [false],
    });
  }

  ngOnInit(): void {
    // Load taxonomy for sidebar filters
    this.productService.getTaxonomy().subscribe({
      next: res => { this.taxonomy = res.taxonomy ?? []; }
    });

    // React to URL query param changes
    this.paramsSub = this.route.queryParams.subscribe(params => {
      this.filterForm.patchValue({
        search:        params['search']        || '',
        typeId:        params['typeId']        || '',
        categoryId:    params['categoryId']    || '',
        subCategoryId: params['subCategoryId'] || '',
        minPrice:      params['minPrice']      || '',
        maxPrice:      params['maxPrice']      || '',
        inStock:       params['inStock'] === 'true',
      }, { emitEvent: false });
      this.pagination.page = Number(params['page']) || 1;
      this.loadProducts();
    });
  }

  ngOnDestroy(): void {
    this.paramsSub?.unsubscribe();
    this.searchSub?.unsubscribe();
  }

  loadProducts(): void {
    this.loading = true;
    const v = this.filterForm.value;

    this.productService.getProducts({
      search:        v.search        || undefined,
      typeId:        v.typeId        ? Number(v.typeId)        : undefined,
      categoryId:    v.categoryId    ? Number(v.categoryId)    : undefined,
      subCategoryId: v.subCategoryId ? Number(v.subCategoryId) : undefined,
      minPrice:      v.minPrice      ? Number(v.minPrice)      : undefined,
      maxPrice:      v.maxPrice      ? Number(v.maxPrice)      : undefined,
      inStock:       v.inStock       || undefined,
      page:          this.pagination.page,
      limit:         this.pagination.limit,
    }).subscribe({
      next: res => {
        console.log(this.products);
        this.products   = res.products   ?? [];
        this.pagination = res.pagination ?? this.pagination;
        this.loading    = false;
      },
      error: () => {
        this.products = [];
        this.loading  = false;
      }
    });
  }

  applyFilters(): void {
    const v = this.filterForm.value;
    const qp: any = { page: 1 };
    if (v.search)        qp['search']        = v.search;
    if (v.typeId)        qp['typeId']        = v.typeId;
    if (v.categoryId)    qp['categoryId']    = v.categoryId;
    if (v.subCategoryId) qp['subCategoryId'] = v.subCategoryId;
    if (v.minPrice)      qp['minPrice']      = v.minPrice;
    if (v.maxPrice)      qp['maxPrice']      = v.maxPrice;
    if (v.inStock)       qp['inStock']       = 'true';
    this.router.navigate(['/products'], { queryParams: qp });
  }

  clearFilters(): void {
    this.router.navigate(['/products']);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination.totalPages) return;
    this.router.navigate(['/products'], {
      queryParams: {
        ...this.route.snapshot.queryParams,
        page,
      },
    });
  }

  onAddToCart(productId: number): void {
    this.cartService.addToCart(productId, 1).subscribe({
      next: () => {
        this.cartSuccessId = productId;
        setTimeout(() => { this.cartSuccessId = null; }, 2000);
      },
      error: err => alert(err.error?.error || 'Could not add to cart')
    });
  }

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

  get activeFilterCount(): number {
    const v = this.filterForm.value;
    return [v.search, v.typeId, v.categoryId, v.subCategoryId,
            v.minPrice, v.maxPrice, v.inStock]
      .filter(Boolean).length;
  }

  get currentSearchLabel(): string {
    const params = this.route.snapshot.queryParams;
    if (params['search']) return `Results for "${params['search']}"`;
    if (params['subCategoryId']) return 'Sub-category products';
    if (params['categoryId']) return 'Category products';
    if (params['typeId']) return 'Type products';
    return 'All Products';
  }

  get skeletons(): number[] {
    return Array.from({ length: 12 }, (_, i) => i);
  }
}