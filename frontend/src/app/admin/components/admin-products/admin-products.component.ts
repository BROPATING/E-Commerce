import { Component, inject, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { ProductService } from '../../../core/services/product.service';
import { Router } from '@angular/router';
import { Product } from '../../../shared/Interface';

/**
 * AdminProductsComponent
 * ----------------------
 * Provides product management functionality for administrators:
 * - Displays all products
 * - Allows editing and deletion
 * - Handles loading state and error feedback
 */
@Component({
  selector: 'app-admin-products',
  standalone: false,
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit {
  /** List of products loaded from backend */
  products: Product[] = [];

  /** Loading flag for initial data fetch */
  loading = true;

  /** Injected services */
  private adminService = inject(AdminService);
  private productService = inject(ProductService);
  private router = inject(Router);

  /**
   * Lifecycle hook: OnInit
   * - Loads products on component initialization
   */
  ngOnInit(): void { 
    this.loadProducts(); 
  }

  /**
   * Fetch all products from backend
   * - Updates products list
   * - Handles loading state
   */
  loadProducts(): void {
    this.adminService.getAllProducts().subscribe({
      next: res => { 
        this.products = res.products; 
        this.loading = false; 
      },
      error: ()  => { 
        this.loading = false; 
      }
    });
  }

  /**
   * Utility: Get product image URL
   * @param imagePath relative path or null
   */
  getImageUrl(imagePath: string | null): string {
    return this.productService.getImageUrl(imagePath);
  }

  /**
   * Navigate to product edit page
   * @param id product identifier
   */
  editProduct(id: number): void {
    this.router.navigate(['/admin/products', id, 'edit']);
  }

  /**
   * Delete product
   * - Confirms action with user
   * - Calls AdminService.deleteProduct
   * - Reloads product list on success
   * @param id product identifier
   * @param name product name (for confirmation message)
   */
  deleteProduct(id: number, name: string): void {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    this.adminService.deleteProduct(id).subscribe({
      next: () => this.loadProducts(),
      error: err => alert(err.error?.error || 'Delete failed'),
    });
  }
}