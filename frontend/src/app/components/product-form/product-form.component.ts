import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  submitting = signal(false);
  loading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  isEditMode = signal(false);
  productId: string | null = null;

  productForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0.01)]],
    expirationDate: ['', Validators.required]
  });

  ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode.set(true);
      this.loadProduct(this.productId);
    }
  }

  loadProduct(id: string) {
    this.loading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          price: product.price,
          expirationDate: product.expirationDate
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load product. Please try again.');
        this.loading.set(false);
        console.error('Error loading product:', err);
      }
    });
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.submitting.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      const productData = this.productForm.getRawValue();

      const operation = this.isEditMode() && this.productId
        ? this.productService.updateProduct(this.productId, productData)
        : this.productService.addProduct(productData);

      operation.subscribe({
        next: () => {
          this.successMessage.set(
            this.isEditMode()
              ? 'Product updated successfully!'
              : 'Product added successfully!'
          );
          this.submitting.set(false);
          setTimeout(() => {
            this.router.navigate(['/products']);
          }, 1500);
        },
        error: (err) => {
          this.errorMessage.set(
            err.error?.message || 'Failed to save product. Please try again.'
          );
          this.submitting.set(false);
          console.error('Error saving product:', err);
        }
      });
    }
  }

  cancel() {
    this.router.navigate(['/products']);
  }
}
