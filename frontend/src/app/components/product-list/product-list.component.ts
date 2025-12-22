import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
    selector: 'app-product-list',
    imports: [CommonModule, RouterLink],
    template: `
    <div class="container">
      <div class="header">
        <h2>Products</h2>
        <a routerLink="/products/create" class="btn btn-primary">Add New Product</a>
      </div>

      @if (loading()) {
        <div class="loading">Loading products...</div>
      }

      @if (error()) {
        <div class="error">{{ error() }}</div>
      }

      @if (successMessage()) {
        <div class="success">{{ successMessage() }}</div>
      }

      @if (products().length === 0 && !loading() && !error()) {
        <div class="empty-state">
          <p>No products found. Add your first product!</p>
        </div>
      }

      @if (products().length > 0) {
        <div class="products-grid">
          @for (product of products(); track product.id) {
            <div class="product-card">
              <h3>{{ product.name }}</h3>
              <div class="product-info">
                <p><strong>Price:</strong> {{ '$' + product.price }}</p>
                <p><strong>Expires:</strong> {{ product.expirationDate }}</p>
                <p class="product-id"><strong>ID:</strong> {{ product.id }}</p>
              </div>
              <div class="product-actions">
                <a [routerLink]="['/products/edit', product.id]" class="btn btn-sm btn-secondary">Edit</a>
                <button (click)="deleteProduct(product.id!)" class="btn btn-sm btn-danger">Delete</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h2 {
      margin: 0;
      color: #333;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    .btn-danger {
      background-color: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background-color: #c82333;
    }

    .loading, .error, .success, .empty-state {
      text-align: center;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .error {
      background-color: #fee;
      color: #c33;
      border: 1px solid #fcc;
    }

    .success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .empty-state {
      background-color: #f8f9fa;
      color: #666;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .product-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      flex-direction: column;
    }

    .product-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .product-card h3 {
      margin: 0 0 1rem 0;
      color: #007bff;
    }

    .product-info {
      flex: 1;
      margin-bottom: 1rem;
    }

    .product-info p {
      margin: 0.5rem 0;
      color: #666;
    }

    .product-id {
      font-size: 0.875rem;
      color: #999;
    }

    .product-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: auto;
    }
  `]
})
export class ProductListComponent implements OnInit {
    private readonly productService = inject(ProductService);

    products = signal<Product[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);
    successMessage = signal<string | null>(null);

    ngOnInit() {
        this.loadProducts();
    }

    loadProducts() {
        this.loading.set(true);
        this.error.set(null);

        this.productService.getAllProducts().subscribe({
            next: (products) => {
                this.products.set(products);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set('Failed to load products. Please try again.');
                this.loading.set(false);
                console.error('Error loading products:', err);
            }
        });
    }

    deleteProduct(id: string) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.productService.deleteProduct(id).subscribe({
                next: () => {
                    this.successMessage.set('Product deleted successfully!');
                    this.loadProducts();
                    setTimeout(() => this.successMessage.set(null), 3000);
                },
                error: (err) => {
                    this.error.set('Failed to delete product. Please try again.');
                    console.error('Error deleting product:', err);
                    setTimeout(() => this.error.set(null), 3000);
                }
            });
        }
    }
}
