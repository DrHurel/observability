import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { UserContextService } from '../../services/user-context.service';
import { Product } from '../../models/product.model';

@Component({
    selector: 'app-marketplace',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './marketplace.component.html',
    styleUrl: './marketplace.component.scss'
})
export class MarketplaceComponent implements OnInit {
    private readonly productService = inject(ProductService);
    private readonly userContext = inject(UserContextService);

    readonly isLoggedIn = this.userContext.isLoggedIn;

    readonly products = signal<Product[]>([]);
    readonly loading = signal(true);
    readonly selectedProduct = signal<Product | null>(null);
    readonly sortBy = signal<string>('name');
    readonly cartMessage = signal<string | null>(null);

    searchQuery = '';
    priceRange = 'all';

    readonly filteredProducts = computed(() => {
        let result = [...this.products()];

        // Search filter
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(query));
        }

        // Price filter
        if (this.priceRange !== 'all') {
            result = result.filter(p => {
                switch (this.priceRange) {
                    case '0-50': return p.price < 50;
                    case '50-100': return p.price >= 50 && p.price < 100;
                    case '100-500': return p.price >= 100 && p.price < 500;
                    case '500+': return p.price >= 500;
                    default: return true;
                }
            });
        }

        // Sort
        const sort = this.sortBy();
        if (sort === 'name') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'price-low') {
            result.sort((a, b) => a.price - b.price);
        } else if (sort === 'price-high') {
            result.sort((a, b) => b.price - a.price);
        }

        return result;
    });

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(): void {
        this.loading.set(true);
        this.productService.getAllProducts().subscribe({
            next: (products) => {
                this.products.set(products);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }

    onSearch(): void {
        // Trigger computed update
        this.products.update(p => [...p]);
    }

    clearSearch(): void {
        this.searchQuery = '';
        this.priceRange = 'all';
        this.onSearch();
    }

    setSortBy(sort: string): void {
        this.sortBy.set(sort);
    }

    viewProduct(product: Product): void {
        this.selectedProduct.set(product);
    }

    closeModal(): void {
        this.selectedProduct.set(null);
    }

    addToCart(product: Product): void {
        this.cartMessage.set(`Added "${product.name}" to cart!`);
        setTimeout(() => this.cartMessage.set(null), 3000);
        this.closeModal();
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString();
    }

    isExpiringSoon(product: Product): boolean {
        const expDate = new Date(product.expirationDate);
        const now = new Date();
        const daysUntilExpiry = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }
}
