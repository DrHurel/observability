import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserContextService } from '../../services/user-context.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
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

