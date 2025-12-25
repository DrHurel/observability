import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService } from '../../services/profile.service';
import { UserContextService } from '../../services/user-context.service';
import { UserProfile } from '../../models/profile.model';

@Component({
    selector: 'app-profile-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './profile-list.component.html',
    styleUrl: './profile-list.component.scss'
})
export class ProfileListComponent implements OnInit {
    private readonly profileService = inject(ProfileService);
    private readonly userContext = inject(UserContextService);

    readonly profiles = signal<UserProfile[]>([]);
    readonly loading = signal(true);
    readonly error = signal<string | null>(null);
    readonly selectedProfile = signal<UserProfile | null>(null);
    readonly filterType = signal<string>('ALL');

    readonly currentUserEmail = this.userContext.userEmail;

    readonly filteredProfiles = computed(() => {
        const type = this.filterType();
        const all = this.profiles();
        if (type === 'ALL') {
            return all;
        }
        return all.filter(p => p.profileType === type);
    });

    readonly stats = computed(() => {
        const all = this.profiles();
        return {
            total: all.length,
            readHeavy: all.filter(p => p.profileType === 'READ_HEAVY').length,
            writeHeavy: all.filter(p => p.profileType === 'WRITE_HEAVY').length,
            expensiveSeeker: all.filter(p => p.profileType === 'EXPENSIVE_SEEKER').length,
            balanced: all.filter(p => p.profileType === 'BALANCED').length
        };
    });

    ngOnInit(): void {
        this.loadProfiles();
    }

    loadProfiles(): void {
        this.loading.set(true);
        this.error.set(null);

        this.profileService.getAllProfiles().subscribe({
            next: (profiles) => {
                this.profiles.set(profiles);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set('Failed to load profiles: ' + err.message);
                this.loading.set(false);
            }
        });
    }

    selectProfile(profile: UserProfile): void {
        this.selectedProfile.set(
            this.selectedProfile()?.id === profile.id ? null : profile
        );
    }

    setFilter(type: string): void {
        this.filterType.set(type);
    }

    getProfileTypeClass(type: string): string {
        switch (type) {
            case 'READ_HEAVY': return 'badge-read';
            case 'WRITE_HEAVY': return 'badge-write';
            case 'EXPENSIVE_SEEKER': return 'badge-expensive';
            case 'BALANCED': return 'badge-balanced';
            default: return '';
        }
    }

    getProfileTypeIcon(type: string): string {
        switch (type) {
            case 'READ_HEAVY': return '📖';
            case 'WRITE_HEAVY': return '✏️';
            case 'EXPENSIVE_SEEKER': return '💰';
            case 'BALANCED': return '⚖️';
            default: return '❓';
        }
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString();
    }

    formatPrice(price: number | null): string {
        if (price === null || price === undefined) return 'N/A';
        return '$' + price.toFixed(2);
    }

    isCurrentUser(profile: UserProfile): boolean {
        const email = this.currentUserEmail();
        return email !== null && profile.userEmail === email;
    }
}
