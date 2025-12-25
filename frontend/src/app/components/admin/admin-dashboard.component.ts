import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { UserService } from '../../services/user.service';
import { ProfileService } from '../../services/profile.service';
import { UserContextService } from '../../services/user-context.service';
import { Product } from '../../models/product.model';
import { User } from '../../models/user.model';
import { UserProfile } from '../../models/profile.model';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        <div class="admin-container">
            <div class="admin-header">
                <h1>🛡️ Admin Dashboard</h1>
                <p>System overview and management</p>
            </div>

            <!-- Quick Stats -->
            <div class="stats-grid">
                <div class="stat-card users">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <span class="stat-value">{{ users().length }}</span>
                        <span class="stat-label">Total Users</span>
                    </div>
                </div>
                <div class="stat-card products">
                    <div class="stat-icon">📦</div>
                    <div class="stat-info">
                        <span class="stat-value">{{ products().length }}</span>
                        <span class="stat-label">Total Products</span>
                    </div>
                </div>
                <div class="stat-card revenue">
                    <div class="stat-icon">💰</div>
                    <div class="stat-info">
                        <span class="stat-value">\${{ totalRevenue().toFixed(2) }}</span>
                        <span class="stat-label">Total Value</span>
                    </div>
                </div>
                <div class="stat-card profiles">
                    <div class="stat-icon">📊</div>
                    <div class="stat-info">
                        <span class="stat-value">{{ profiles().length }}</span>
                        <span class="stat-label">User Profiles</span>
                    </div>
                </div>
            </div>

            <!-- Profile Analytics -->
            <div class="analytics-section">
                <h2>📈 User Behavior Analytics</h2>
                <div class="analytics-grid">
                    <div class="chart-card">
                        <h3>Profile Distribution</h3>
                        <div class="profile-bars">
                            @for (type of profileTypes(); track type.name) {
                                <div class="bar-item">
                                    <div class="bar-label">
                                        <span>{{ type.icon }} {{ type.name }}</span>
                                        <span>{{ type.count }}</span>
                                    </div>
                                    <div class="bar-track">
                                        <div 
                                            class="bar-fill"
                                            [style.width.%]="type.percentage"
                                            [style.background]="type.color">
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                    <div class="chart-card">
                        <h3>Activity Summary</h3>
                        <div class="activity-stats">
                            <div class="activity-item">
                                <span class="activity-icon">📖</span>
                                <div class="activity-info">
                                    <span class="activity-value">{{ totalReads() }}</span>
                                    <span class="activity-label">Read Operations</span>
                                </div>
                            </div>
                            <div class="activity-item">
                                <span class="activity-icon">✏️</span>
                                <div class="activity-info">
                                    <span class="activity-value">{{ totalWrites() }}</span>
                                    <span class="activity-label">Write Operations</span>
                                </div>
                            </div>
                            <div class="activity-item">
                                <span class="activity-icon">💎</span>
                                <div class="activity-info">
                                    <span class="activity-value">{{ totalExpensiveSearches() }}</span>
                                    <span class="activity-label">Premium Searches</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="tables-section">
                <div class="table-card">
                    <div class="table-header">
                        <h3>👥 Recent Users</h3>
                        <a routerLink="/users" class="view-all">View All →</a>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Age</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (user of users().slice(0, 5); track user.id) {
                                <tr>
                                    <td>{{ user.name }}</td>
                                    <td>{{ user.email }}</td>
                                    <td>{{ user.age }}</td>
                                </tr>
                            } @empty {
                                <tr>
                                    <td colspan="3" class="empty">No users found</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>

                <div class="table-card">
                    <div class="table-header">
                        <h3>📦 Recent Products</h3>
                        <a routerLink="/products" class="view-all">View All →</a>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (product of products().slice(0, 5); track product.id) {
                                <tr>
                                    <td>{{ product.name }}</td>
                                    <td class="price">\${{ product.price.toFixed(2) }}</td>
                                    <td>
                                        <span class="status" [ngClass]="getProductStatus(product).class">
                                            {{ getProductStatus(product).text }}
                                        </span>
                                    </td>
                                </tr>
                            } @empty {
                                <tr>
                                    <td colspan="3" class="empty">No products found</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Top Users by Activity -->
            <div class="top-users-section">
                <h2>🏆 Top Users by Activity</h2>
                <div class="top-users-grid">
                    @for (profile of topProfiles(); track profile.id; let i = $index) {
                        <div class="user-rank-card">
                            <div class="rank-badge">{{ i + 1 }}</div>
                            <div class="user-info">
                                <span class="user-name">{{ profile.userEmail || 'Anonymous' }}</span>
                                <span class="user-stats">
                                    {{ profile.readOperations + profile.writeOperations }} actions
                                </span>
                            </div>
                            <div class="profile-badge" [ngClass]="'type-' + profile.profileType.toLowerCase().replace('_', '-')">
                                {{ profile.profileType }}
                            </div>
                        </div>
                    }
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <h2>⚡ Quick Actions</h2>
                <div class="actions-grid">
                    <a routerLink="/users/create" class="action-card">
                        <span class="action-icon">➕</span>
                        <span class="action-text">Add User</span>
                    </a>
                    <a routerLink="/sell" class="action-card">
                        <span class="action-icon">📦</span>
                        <span class="action-text">Add Product</span>
                    </a>
                    <a routerLink="/profiles" class="action-card">
                        <span class="action-icon">📊</span>
                        <span class="action-text">View Profiles</span>
                    </a>
                    <a href="http://localhost:3000" target="_blank" class="action-card">
                        <span class="action-icon">📈</span>
                        <span class="action-text">Grafana</span>
                    </a>
                </div>
            </div>
        </div>
    `,
    styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
    private readonly router = inject(Router);
    private readonly userContext = inject(UserContextService);
    private readonly productService = inject(ProductService);
    private readonly userService = inject(UserService);
    private readonly profileService = inject(ProfileService);

    readonly users = signal<User[]>([]);
    readonly products = signal<Product[]>([]);
    readonly profiles = signal<UserProfile[]>([]);

    readonly totalRevenue = computed(() =>
        this.products().reduce((sum, p) => sum + p.price, 0)
    );

    readonly totalReads = computed(() =>
        this.profiles().reduce((sum, p) => sum + p.readOperations, 0)
    );

    readonly totalWrites = computed(() =>
        this.profiles().reduce((sum, p) => sum + p.writeOperations, 0)
    );

    readonly totalExpensiveSearches = computed(() =>
        this.profiles().reduce((sum, p) => sum + p.expensiveProductSearches, 0)
    );

    readonly profileTypes = computed(() => {
        const counts = {
            READ_HEAVY: 0,
            WRITE_HEAVY: 0,
            EXPENSIVE_SEEKER: 0,
            BALANCED: 0
        };

        this.profiles().forEach(p => {
            if (counts[p.profileType] !== undefined) {
                counts[p.profileType]++;
            }
        });

        const total = this.profiles().length || 1;

        return [
            { name: 'Read Heavy', count: counts.READ_HEAVY, percentage: (counts.READ_HEAVY / total) * 100, icon: '📖', color: '#28a745' },
            { name: 'Write Heavy', count: counts.WRITE_HEAVY, percentage: (counts.WRITE_HEAVY / total) * 100, icon: '✏️', color: '#dc3545' },
            { name: 'Expensive Seeker', count: counts.EXPENSIVE_SEEKER, percentage: (counts.EXPENSIVE_SEEKER / total) * 100, icon: '💰', color: '#ffc107' },
            { name: 'Balanced', count: counts.BALANCED, percentage: (counts.BALANCED / total) * 100, icon: '⚖️', color: '#6c757d' }
        ];
    });

    readonly topProfiles = computed(() =>
        [...this.profiles()]
            .sort((a, b) => (b.readOperations + b.writeOperations) - (a.readOperations + a.writeOperations))
            .slice(0, 5)
    );

    ngOnInit(): void {
        if (!this.userContext.isAdmin()) {
            this.router.navigate(['/']);
            return;
        }
        this.loadData();
    }

    loadData(): void {
        this.userService.getAllUsers().subscribe({
            next: (users) => this.users.set(users)
        });

        this.productService.getAllProducts().subscribe({
            next: (products) => this.products.set(products)
        });

        this.profileService.getAllProfiles().subscribe({
            next: (profiles) => this.profiles.set(profiles)
        });
    }

    getProductStatus(product: Product): { text: string; class: string } {
        const expDate = new Date(product.expirationDate);
        const now = new Date();
        const daysUntilExpiry = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

        if (daysUntilExpiry < 0) return { text: 'Expired', class: 'status-expired' };
        if (daysUntilExpiry <= 30) return { text: 'Expiring', class: 'status-warning' };
        return { text: 'Active', class: 'status-active' };
    }
}
