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
    templateUrl: './my-shop.component.html',
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
