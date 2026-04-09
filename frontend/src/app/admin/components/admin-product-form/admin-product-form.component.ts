import { Component, OnInit } from '@angular/core';
import { Product } from '../../../shared/Interface';
import { AdminService } from '../../../core/services/admin.service';
import { ProductService } from '../../../core/services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-admin-product-form',
  standalone: false,
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.css'
})
export class AdminProductFormComponent implements OnInit {
  form: FormGroup;
  taxonomy: any[] = [];
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isEditMode = false;
  productId: number | null = null;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name:          ['', Validators.required],
      description:   ['', Validators.required],
      price:         ['', [Validators.required, Validators.min(0)]],
      stock:         ['', [Validators.required, Validators.min(0)]],
      subCategoryId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.adminService.getTaxonomy().subscribe(
      (res: any) => { this.taxonomy = res.taxonomy; }
    );

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productId = Number(id);
      this.productService.getProductById(this.productId).subscribe(res => {
        const p = res.product;
        this.form.patchValue({
          name:          p.name,
          description:   p.description,
          price:         p.price,
          stock:         p.stock,
          subCategoryId: p.subCategory?.id,
        });
        if (p.imagePath) {
          this.previewUrl = this.productService.getImageUrl(p.imagePath);
        }
      });
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = e => { this.previewUrl = e.target?.result as string; };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('name',          this.form.value.name);
    formData.append('description',   this.form.value.description);
    formData.append('price',         this.form.value.price);
    formData.append('stock',         this.form.value.stock);
    formData.append('subCategoryId', this.form.value.subCategoryId);
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const request$ = this.isEditMode && this.productId
      ? this.adminService.updateProduct(this.productId, formData)
      : this.adminService.createProduct(formData);

    request$.subscribe({
      next: () => this.router.navigate(['/admin/products']),
      error: err => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Save failed.';
      }
    });
  }

  // Flatten all subcategories for the dropdown
  get allSubCategories(): { id: number; label: string }[] {
    const result: { id: number; label: string }[] = [];
    for (const type of this.taxonomy) {
      for (const cat of type.categories) {
        for (const sub of cat.subCategories) {
          result.push({
            id:    sub.id,
            label: `${type.name} › ${cat.name} › ${sub.name}`,
          });
        }
      }
    }
    return result;
  }
}
