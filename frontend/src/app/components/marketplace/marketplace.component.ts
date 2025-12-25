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
    template: `
        <div class="marketplace-container">
            <div class="marketplace-header">
                <div class="header-content">
                    <h1>🛍️ Marketplace</h1>
                    <p>Discover amazing products from our sellers</p>
                </div>
                <div class="header-actions">
                    @if (isLoggedIn()) {
                        <a routerLink="/sell" class="btn-sell">+ Sell an Item</a>
                    } @else {
                        <a routerLink="/login" class="btn-sell">Login to Sell</a>
                    }
                </div>
            </div>

            <!-- Search and Filters -->
            <div class="filters-bar">
                <div class="search-box">
                    <input 
                        type="text" 
                        placeholder="Search products..."
                        [(ngModel)]="searchQuery"
                        (ngModelChange)="onSearch()">
                    <span class="search-icon">🔍</span>
                </div>
                <div class="filter-buttons">
                    <button 
                        [class.active]="sortBy() === 'name'"
                        (click)="setSortBy('name')">Name</button>
                    <button 
                        [class.active]="sortBy() === 'price-low'"
                        (click)="setSortBy('price-low')">Price ↑</button>
                    <button 
                        [class.active]="sortBy() === 'price-high'"
                        (click)="setSortBy('price-high')">Price ↓</button>
                </div>
                <div class="price-filter">
                    <select [(ngModel)]="priceRange" (ngModelChange)="onSearch()">
                        <option value="all">All Prices</option>
                        <option value="0-50">Under $50</option>
                        <option value="50-100">$50 - $100</option>
                        <option value="100-500">$100 - $500</option>
                        <option value="500+">$500+</option>
                    </select>
                </div>
            </div>

            <!-- Results Count -->
            <div class="results-info">
                <span>{{ filteredProducts().length }} products found</span>
                @if (searchQuery) {
                    <button class="clear-search" (click)="clearSearch()">Clear search</button>
                }
            </div>

            <!-- Loading State -->
            @if (loading()) {
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading products...</p>
                </div>
            }

            <!-- Products Grid -->
            @if (!loading()) {
                <div class="products-grid">
                    @for (product of filteredProducts(); track product.id) {
                        <div class="product-card" (click)="viewProduct(product)">
                            <div class="product-image">
                                <span class="placeholder-icon">📦</span>
                                @if (isExpiringSoon(product)) {
                                    <span class="badge expiring">Expiring Soon</span>
                                }
                                @if (product.price >= 100) {
                                    <span class="badge premium">Premium</span>
                                }
                            </div>
                            <div class="product-info">
                                <h3>{{ product.name }}</h3>
                                <p class="price">\${{ product.price.toFixed(2) }}</p>
                                <p class="expiry">Expires: {{ formatDate(product.expirationDate) }}</p>
                            </div>
                            <div class="product-actions">
                                <button class="btn-view" (click)="viewProduct(product); $event.stopPropagation()">
                                    View Details
                                </button>
                                @if (isLoggedIn()) {
                                    <button class="btn-cart" (click)="addToCart(product); $event.stopPropagation()">
                                        🛒
                                    </button>
                                }
                            </div>
                        </div>
                    } @empty {
                        <div class="empty-state">
                            <span class="empty-icon">🔍</span>
                            <h3>No products found</h3>
                            <p>Try adjusting your search or filters</p>
                        </div>
                    }
                </div>
            }

            <!-- Product Modal -->
            @if (selectedProduct()) {
                <div class="modal-overlay" (click)="closeModal()">
                    <div class="modal-content" (click)="$event.stopPropagation()">
                        <button class="modal-close" (click)="closeModal()">×</button>
                        <div class="modal-body">
                            <div class="modal-image">
                                <span class="placeholder-icon large">📦</span>
                            </div>
                            <div class="modal-info">
                                <h2>{{ selectedProduct()!.name }}</h2>
                                <p class="modal-price">\${{ selectedProduct()!.price.toFixed(2) }}</p>
                                <div class="modal-details">
                                    <p><strong>Product ID:</strong> {{ selectedProduct()!.id }}</p>
                                    <p><strong>Expiration:</strong> {{ formatDate(selectedProduct()!.expirationDate) }}</p>
                                </div>
                                @if (isLoggedIn()) {
                                    <div class="modal-actions">
                                        <button class="btn-primary" (click)="addToCart(selectedProduct()!)">
                                            Add to Cart 🛒
                                        </button>
                                    </div>
                                } @else {
                                    <div class="login-prompt">
                                        <p>Login to purchase this item</p>
                                        <a routerLink="/login" class="btn-primary">Login</a>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            }

            <!-- Cart Toast -->
            @if (cartMessage()) {
                <div class="cart-toast">
                    {{ cartMessage() }}
                </div>
            }
        </div>
    `,
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
