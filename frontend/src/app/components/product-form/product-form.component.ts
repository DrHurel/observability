import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';

@Component({
    selector: 'app-product-form',
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="container">
      <h2>{{ isEditMode() ? 'Edit Product' : 'Add New Product' }}</h2>

      @if (loading()) {
        <div class="loading">Loading product...</div>
      }

      @if (successMessage()) {
        <div class="success-message">{{ successMessage() }}</div>
      }

      @if (errorMessage()) {
        <div class="error-message">{{ errorMessage() }}</div>
      }

      @if (!loading()) {
        <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="product-form">
          <div class="form-group">
            <label for="name">Product Name *</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              placeholder="Enter product name"
              [class.invalid]="productForm.get('name')?.invalid && productForm.get('name')?.touched"
            />
            @if (productForm.get('name')?.invalid && productForm.get('name')?.touched) {
              <span class="error-text">Product name is required</span>
            }
          </div>

          <div class="form-group">
            <label for="price">Price *</label>
            <input
              id="price"
              type="number"
              step="0.01"
              formControlName="price"
              placeholder="Enter price"
              [class.invalid]="productForm.get('price')?.invalid && productForm.get('price')?.touched"
            />
            @if (productForm.get('price')?.invalid && productForm.get('price')?.touched) {
              <span class="error-text">Price must be greater than 0</span>
            }
          </div>

          <div class="form-group">
            <label for="expirationDate">Expiration Date *</label>
            <input
              id="expirationDate"
              type="date"
              formControlName="expirationDate"
              [class.invalid]="productForm.get('expirationDate')?.invalid && productForm.get('expirationDate')?.touched"
            />
            @if (productForm.get('expirationDate')?.invalid && productForm.get('expirationDate')?.touched) {
              <span class="error-text">Expiration date is required</span>
            }
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="productForm.invalid || submitting()">
              {{ submitting() ? 'Saving...' : (isEditMode() ? 'Update Product' : 'Add Product') }}
            </button>
            <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
          </div>
        </form>
      }
    </div>
  `,
    styles: [`
    .container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }

    h2 {
      margin-bottom: 2rem;
      color: #333;
    }

    .loading {
      text-align: center;
      padding: 2rem;
    }

    .success-message, .error-message {
      padding: 1rem;
      margin-bottom: 1.5rem;
      border-radius: 4px;
    }

    .success-message {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .error-message {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .product-form {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    input:focus {
      outline: none;
      border-color: #007bff;
    }

    input.invalid {
      border-color: #dc3545;
    }

    .error-text {
      display: block;
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }
  `]
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
