import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserContextService } from '../../services/user-context.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-container">
      <div class="hero">
        <h1>🛒 Welcome to ShopTrack</h1>
        <p class="subtitle">Buy, Sell, and Track Your Shopping Experience</p>
        <div class="hero-actions">
          @if (userContextService.isLoggedIn()) {
            <a routerLink="/shop" class="btn btn-hero-primary">Browse Marketplace</a>
            <a routerLink="/sell" class="btn btn-hero-secondary">Start Selling</a>
          } @else {
            <a routerLink="/register" class="btn btn-hero-primary">Get Started</a>
            <a routerLink="/login" class="btn btn-hero-secondary">Sign In</a>
          }
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">{{ totalProducts() }}</span>
          <span class="stat-label">Products Listed</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ categories().length }}</span>
          <span class="stat-label">Categories</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">$ {{ avgPrice() | number:'1.0-0' }}</span>
          <span class="stat-label">Avg. Price</span>
        </div>
      </div>

      <section class="featured-section">
        <div class="section-header">
          <h2>🔥 Featured Products</h2>
          <a routerLink="/shop" class="view-all">View All →</a>
        </div>
        <div class="products-grid">
          @for (product of featuredProducts(); track product.id) {
            <div class="product-card">
              <div class="product-image">{{ getCategoryEmoji(product.name) }}</div>
              <div class="product-info">
                <h3>{{ product.name }}</h3>
                <p class="product-price">\${{ product.price | number:'1.2-2' }}</p>
                @if (product.expirationDate) {
                  <p class="product-expiry">Exp: {{ product.expirationDate | date:'shortDate' }}</p>
                }
              </div>
            </div>
          } @empty {
            <div class="empty-products">
              <p>No products yet. Be the first to sell!</p>
              <a routerLink="/sell" class="btn btn-primary">Add Product</a>
            </div>
          }
        </div>
      </section>

      <div class="features-grid">
        <div class="feature-card">
          <div class="icon">🛍️</div>
          <h2>Browse & Buy</h2>
          <p>Explore thousands of products from sellers around the world. Filter by price, search by name, and find your perfect item.</p>
          <div class="card-actions">
            <a routerLink="/shop" class="btn btn-primary">Go to Marketplace</a>
          </div>
        </div>

        <div class="feature-card">
          <div class="icon">💼</div>
          <h2>Sell Your Items</h2>
          <p>List your products for sale. Manage your inventory, set prices, and reach a wide audience of buyers.</p>
          <div class="card-actions">
            <a routerLink="/sell" class="btn btn-primary">Start Selling</a>
          </div>
        </div>

        <div class="feature-card highlight">
          <div class="icon">🎭</div>
          <h2>User Profiling</h2>
          <p>We use advanced LPS (Log, Parse, Store) pattern to analyze your shopping behavior and personalize your experience.</p>
          <div class="card-actions">
            <a routerLink="/profiles" class="btn btn-primary">View Profiles</a>
          </div>
          <div class="profile-types">
            <span class="profile-badge read">📖 Reader</span>
            <span class="profile-badge write">✏️ Seller</span>
            <span class="profile-badge expensive">💰 Premium</span>
            <span class="profile-badge balanced">⚖️ Balanced</span>
          </div>
        </div>

        <div class="feature-card">
          <div class="icon">📊</div>
          <h2>Analytics & Monitoring</h2>
          <p>Real-time observability with distributed tracing, event streaming, and comprehensive dashboards.</p>
          <div class="card-actions">
            <a href="http://localhost:3000" target="_blank" class="btn btn-primary">Open Grafana</a>
          </div>
        </div>
      </div>

      <div class="profiling-info">
        <h3>🎯 How User Profiling Works</h3>
        <div class="profiling-steps">
          <div class="step">
            <span class="step-number">1</span>
            <div class="step-content">
              <strong>Register & Login</strong>
              <p>Create your account to start tracking your shopping behavior.</p>
            </div>
          </div>
          <div class="step">
            <span class="step-number">2</span>
            <div class="step-content">
              <strong>Shop Around</strong>
              <p>Browse products, add items, make purchases. Every action is recorded.</p>
            </div>
          </div>
          <div class="step">
            <span class="step-number">3</span>
            <div class="step-content">
              <strong>Get Profiled</strong>
              <p>View your behavioral profile - are you a reader, seller, or premium shopper?</p>
            </div>
          </div>
        </div>
      </div>

      <div class="info-section">
        <h3>Built With Modern Technology</h3>
        <div class="tech-tags">
          <span class="tag">Angular 21</span>
          <span class="tag">Spring Boot</span>
          <span class="tag">MongoDB</span>
          <span class="tag">Kafka</span>
          <span class="tag">ClickHouse</span>
          <span class="tag">Grafana</span>
          <span class="tag">Docker</span>
          <span class="tag">OpenTelemetry</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .hero {
      text-align: center;
      padding: 4rem 2rem;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      color: white;
    }

    .hero h1 {
      margin: 0 0 1rem 0;
      font-size: 3rem;
    }

    .subtitle {
      font-size: 1.5rem;
      opacity: 0.9;
      margin: 0 0 2rem 0;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-hero-primary {
      background-color: white;
      color: #667eea;
      padding: 1rem 2rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.1rem;
      transition: all 0.3s;
    }

    .btn-hero-primary:hover {
      background-color: #f0f0ff;
      transform: translateY(-2px);
    }

    .btn-hero-secondary {
      background-color: transparent;
      border: 2px solid white;
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 1.1rem;
      transition: all 0.3s;
    }

    .btn-hero-secondary:hover {
      background-color: rgba(255,255,255,0.1);
    }

    .stats-bar {
      display: flex;
      justify-content: center;
      gap: 3rem;
      padding: 1.5rem 2rem;
      background: white;
      border-radius: 12px;
      margin-bottom: 3rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: #667eea;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
    }

    .featured-section {
      margin-bottom: 3rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #333;
    }

    .view-all {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .view-all:hover {
      text-decoration: underline;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
    }

    .product-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .product-image {
      height: 120px;
      background: linear-gradient(135deg, #f8f9ff 0%, #e8e9ff 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
    }

    .product-info {
      padding: 1rem;
    }

    .product-info h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .product-price {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #28a745;
    }

    .product-expiry {
      margin: 0.25rem 0 0 0;
      font-size: 0.8rem;
      color: #999;
    }

    .empty-products {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      color: #666;
    }

    .empty-products .btn {
      margin-top: 1rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .feature-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h2 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.3rem;
    }

    .feature-card p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .card-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
      font-size: 0.9rem;
      display: inline-block;
    }

    .btn-primary {
      background-color: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background-color: #5563c1;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    .feature-card.highlight {
      border: 2px solid #667eea;
      background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
    }

    .profile-types {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .profile-badge {
      font-size: 0.75rem;
      padding: 0.3rem 0.6rem;
      border-radius: 12px;
      font-weight: 500;
    }

    .profile-badge.read {
      background: #d4edda;
      color: #155724;
    }

    .profile-badge.write {
      background: #f8d7da;
      color: #721c24;
    }

    .profile-badge.expensive {
      background: #fff3cd;
      color: #856404;
    }

    .profile-badge.balanced {
      background: #e2e3e5;
      color: #383d41;
    }

    .profiling-info {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      color: white;
    }

    .profiling-info h3 {
      margin: 0 0 1.5rem 0;
      font-size: 1.3rem;
    }

    .profiling-steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .step {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .step-content strong {
      display: block;
      margin-bottom: 0.25rem;
    }

    .step-content p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }

    .info-section {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 2rem;
    }

    .info-section h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
    }

    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .tag {
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .stats-bar {
        flex-direction: column;
        gap: 1rem;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  protected readonly userContextService = inject(UserContextService);
  private readonly productService = inject(ProductService);

  protected readonly totalProducts = signal(0);
  protected readonly avgPrice = signal(0);
  protected readonly categories = signal<string[]>([]);
  protected readonly featuredProducts = signal<Product[]>([]);

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts() {
    this.productService.getAllProducts().subscribe({
      next: (products: Product[]) => {
        this.totalProducts.set(products.length);

        if (products.length > 0) {
          const avg = products.reduce((sum: number, p: Product) => sum + p.price, 0) / products.length;
          this.avgPrice.set(avg);

          const cats: string[] = [...new Set(products.map((p: Product) => this.getCategory(p.name)))];
          this.categories.set(cats);

          // Get 6 random featured products
          const shuffled = [...products].sort(() => 0.5 - Math.random());
          this.featuredProducts.set(shuffled.slice(0, 6));
        }
      }
    });
  }

  private getCategory(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('phone') || lower.includes('laptop') || lower.includes('computer')) return 'Electronics';
    if (lower.includes('apple') || lower.includes('banana') || lower.includes('milk')) return 'Groceries';
    if (lower.includes('shirt') || lower.includes('pants') || lower.includes('shoes')) return 'Clothing';
    return 'Other';
  }

  protected getCategoryEmoji(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('phone')) return '📱';
    if (lower.includes('laptop') || lower.includes('computer')) return '💻';
    if (lower.includes('apple')) return '🍎';
    if (lower.includes('banana')) return '🍌';
    if (lower.includes('milk')) return '🥛';
    if (lower.includes('bread')) return '🍞';
    if (lower.includes('shirt')) return '👕';
    if (lower.includes('pants')) return '👖';
    if (lower.includes('shoes')) return '👟';
    if (lower.includes('book')) return '📚';
    if (lower.includes('car')) return '🚗';
    if (lower.includes('watch')) return '⌚';
    if (lower.includes('game')) return '🎮';
    return '📦';
  }
}
