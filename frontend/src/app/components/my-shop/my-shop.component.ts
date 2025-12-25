import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { UserContextService } from '../../services/user-context.service';
import { Product } from '../../models/product.model';

@Component({
    selector: 'app-my-shop',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="my-shop-container">
            <div class="shop-header">
                <div class="header-info">
                    <h1>🏪 My Shop</h1>
                    <p>Welcome back, {{ userName() }}! Manage your products here.</p>
                </div>
                <div class="header-stats">
                    <div class="stat">
                        <span class="stat-value">{{ products().length }}</span>
                        <span class="stat-label">Products</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">\${{ totalValue().toFixed(2) }}</span>
                        <span class="stat-label">Total Value</span>
                    </div>
                </div>
            </div>

            <div class="shop-content">
                <!-- Add New Product Form -->
                <div class="add-product-section">
                    <h2>➕ Add New Product</h2>
                    <form (ngSubmit)="addProduct()" class="product-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="name">Product Name</label>
                                <input 
                                    type="text" 
                                    id="name"
                                    [(ngModel)]="newProduct.name"
                                    name="name"
                                    placeholder="Enter product name"
                                    required>
                            </div>
                            <div class="form-group">
                                <label for="price">Price ($)</label>
                                <input 
                                    type="number" 
                                    id="price"
                                    [(ngModel)]="newProduct.price"
                                    name="price"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    required>
                            </div>
                            <div class="form-group">
                                <label for="expiration">Expiration Date</label>
                                <input 
                                    type="date" 
                                    id="expiration"
                                    [(ngModel)]="newProduct.expirationDate"
                                    name="expirationDate"
                                    required>
                            </div>
                            <button type="submit" class="btn-add" [disabled]="adding()">
                                @if (adding()) {
                                    Adding...
                                } @else {
                                    Add Product
                                }
                            </button>
                        </div>

                        @if (addError()) {
                            <div class="error-message">{{ addError() }}</div>
                        }
                        @if (addSuccess()) {
                            <div class="success-message">{{ addSuccess() }}</div>
                        }
                    </form>
                </div>

                <!-- My Products List -->
                <div class="products-section">
                    <div class="section-header">
                        <h2>📦 My Products</h2>
                        <button class="btn-refresh" (click)="loadProducts()">🔄 Refresh</button>
                    </div>

                    @if (loading()) {
                        <div class="loading">Loading your products...</div>
                    } @else {
                        <div class="products-table-wrapper">
                            <table class="products-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Price</th>
                                        <th>Expiration</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @for (product of products(); track product.id) {
                                        <tr>
                                            <td class="product-name">
                                                <span class="product-icon">📦</span>
                                                {{ product.name }}
                                            </td>
                                            <td class="price">\${{ product.price.toFixed(2) }}</td>
                                            <td class="date">{{ formatDate(product.expirationDate) }}</td>
                                            <td>
                                                <span class="status" [ngClass]="getStatusClass(product)">
                                                    {{ getStatus(product) }}
                                                </span>
                                            </td>
                                            <td class="actions">
                                                <button class="btn-edit" (click)="editProduct(product)">✏️</button>
                                                <button class="btn-delete" (click)="deleteProduct(product)">🗑️</button>
                                            </td>
                                        </tr>
                                    } @empty {
                                        <tr>
                                            <td colspan="5" class="empty-row">
                                                <p>You haven't added any products yet.</p>
                                                <p class="hint">Add your first product using the form above!</p>
                                            </td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    }
                </div>
            </div>

            <!-- Edit Modal -->
            @if (editingProduct()) {
                <div class="modal-overlay" (click)="cancelEdit()">
                    <div class="modal-content" (click)="$event.stopPropagation()">
                        <h2>✏️ Edit Product</h2>
                        <form (ngSubmit)="saveEdit()" class="edit-form">
                            <div class="form-group">
                                <label for="edit-name">Product Name</label>
                                <input 
                                    type="text" 
                                    id="edit-name"
                                    [(ngModel)]="editForm.name"
                                    name="name"
                                    required>
                            </div>
                            <div class="form-group">
                                <label for="edit-price">Price ($)</label>
                                <input 
                                    type="number" 
                                    id="edit-price"
                                    [(ngModel)]="editForm.price"
                                    name="price"
                                    min="0"
                                    step="0.01"
                                    required>
                            </div>
                            <div class="form-group">
                                <label for="edit-expiration">Expiration Date</label>
                                <input 
                                    type="date" 
                                    id="edit-expiration"
                                    [(ngModel)]="editForm.expirationDate"
                                    name="expirationDate"
                                    required>
                            </div>
                            <div class="modal-actions">
                                <button type="button" class="btn-cancel" (click)="cancelEdit()">Cancel</button>
                                <button type="submit" class="btn-save">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            }

            <!-- Delete Confirmation Modal -->
            @if (deletingProduct()) {
                <div class="modal-overlay" (click)="cancelDelete()">
                    <div class="modal-content confirm-modal" (click)="$event.stopPropagation()">
                        <h2>🗑️ Delete Product?</h2>
                        <p>Are you sure you want to delete <strong>{{ deletingProduct()!.name }}</strong>?</p>
                        <p class="warning">This action cannot be undone.</p>
                        <div class="modal-actions">
                            <button type="button" class="btn-cancel" (click)="cancelDelete()">Cancel</button>
                            <button type="button" class="btn-delete-confirm" (click)="confirmDelete()">Delete</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    `,
    styleUrl: './my-shop.component.scss'
})
export class MyShopComponent implements OnInit {
    private readonly productService = inject(ProductService);
    private readonly userContext = inject(UserContextService);
    private readonly router = inject(Router);

    readonly userName = this.userContext.userName;
    readonly products = signal<Product[]>([]);
    readonly loading = signal(true);
    readonly adding = signal(false);
    readonly addError = signal<string | null>(null);
    readonly addSuccess = signal<string | null>(null);
    readonly editingProduct = signal<Product | null>(null);
    readonly deletingProduct = signal<Product | null>(null);

    newProduct = {
        name: '',
        price: 0,
        expirationDate: this.getDefaultExpirationDate()
    };

    editForm = {
        name: '',
        price: 0,
        expirationDate: ''
    };

    ngOnInit(): void {
        if (!this.userContext.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }
        this.loadProducts();
    }

    loadProducts(): void {
        this.loading.set(true);
        this.productService.getAllProducts().subscribe({
            next: (products) => {
                // In a real app, filter by seller ID
                this.products.set(products);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }

    totalValue(): number {
        return this.products().reduce((sum, p) => sum + p.price, 0);
    }

    addProduct(): void {
        if (!this.newProduct.name || !this.newProduct.price || !this.newProduct.expirationDate) {
            this.addError.set('Please fill in all fields');
            return;
        }

        this.adding.set(true);
        this.addError.set(null);
        this.addSuccess.set(null);

        const product: Product = {
            name: this.newProduct.name,
            price: this.newProduct.price,
            expirationDate: this.newProduct.expirationDate
        };

        this.productService.addProduct(product).subscribe({
            next: () => {
                this.addSuccess.set(`"${product.name}" added successfully!`);
                this.newProduct = {
                    name: '',
                    price: 0,
                    expirationDate: this.getDefaultExpirationDate()
                };
                this.loadProducts();
                this.adding.set(false);
                setTimeout(() => this.addSuccess.set(null), 3000);
            },
            error: (err) => {
                this.addError.set(err.error?.message || 'Failed to add product');
                this.adding.set(false);
            }
        });
    }

    editProduct(product: Product): void {
        this.editingProduct.set(product);
        this.editForm = {
            name: product.name,
            price: product.price,
            expirationDate: product.expirationDate.split('T')[0]
        };
    }

    saveEdit(): void {
        const product = this.editingProduct();
        if (!product?.id) return;

        const updated: Product = {
            ...product,
            name: this.editForm.name,
            price: this.editForm.price,
            expirationDate: this.editForm.expirationDate
        };

        this.productService.updateProduct(product.id, updated).subscribe({
            next: () => {
                this.editingProduct.set(null);
                this.loadProducts();
            }
        });
    }

    cancelEdit(): void {
        this.editingProduct.set(null);
    }

    deleteProduct(product: Product): void {
        this.deletingProduct.set(product);
    }

    confirmDelete(): void {
        const product = this.deletingProduct();
        if (!product?.id) return;

        this.productService.deleteProduct(product.id).subscribe({
            next: () => {
                this.deletingProduct.set(null);
                this.loadProducts();
            }
        });
    }

    cancelDelete(): void {
        this.deletingProduct.set(null);
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString();
    }

    getStatus(product: Product): string {
        const expDate = new Date(product.expirationDate);
        const now = new Date();
        const daysUntilExpiry = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        if (daysUntilExpiry < 0) return 'Expired';
        if (daysUntilExpiry <= 7) return 'Expiring Soon';
        return 'Active';
    }

    getStatusClass(product: Product): string {
        const status = this.getStatus(product);
        switch (status) {
            case 'Expired': return 'status-expired';
            case 'Expiring Soon': return 'status-warning';
            default: return 'status-active';
        }
    }

    private getDefaultExpirationDate(): string {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        return date.toISOString().split('T')[0];
    }
}
