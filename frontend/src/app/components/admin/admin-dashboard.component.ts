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
    templateUrl: './admin-dashboard.component.html',
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
