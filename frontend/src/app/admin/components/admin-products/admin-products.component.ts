import { Component, inject, OnInit } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { ProductService } from '../../../core/services/product.service';
import { Router } from '@angular/router';
import { Product } from '../../../shared/Interface';

@Component({
  selector: 'app-admin-products',
  standalone: false,
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css'
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  loading = true;


    private adminService = inject(AdminService);
    private productService = inject(ProductService);
    private router = inject(Router);


  ngOnInit(): void { this.loadProducts(); }

  loadProducts(): void {
    this.adminService.getAllProducts().subscribe({
      next: res => { this.products = res.products; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  getImageUrl(imagePath: string | null): string {
    return this.productService.getImageUrl(imagePath);
  }

  editProduct(id: number): void {
    this.router.navigate(['/admin/products', id, 'edit']);
  }

  deleteProduct(id: number, name: string): void {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    this.adminService.deleteProduct(id).subscribe({
      next: () => this.loadProducts(),
      error: err => alert(err.error?.error || 'Delete failed'),
    });
  }
}
