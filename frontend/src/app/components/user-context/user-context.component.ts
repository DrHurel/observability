import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserContextService } from '../../services/user-context.service';

@Component({
    selector: 'app-user-context',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './user-context.component.html',
    styleUrl: './user-context.component.scss'
})
export class UserContextComponent {
    private readonly userContext = inject(UserContextService);

    readonly currentUser = this.userContext.currentUser;
    readonly isLoggedIn = this.userContext.isLoggedIn;
    readonly userName = this.userContext.userName;

    readonly showDropdown = signal(false);
    readonly showCustomInput = signal(false);
    readonly customEmail = signal('');
    readonly customName = signal('');

    // Preset users for quick selection
    readonly presetUsers = [
        { email: 'alice@example.com', name: 'Alice Reader' },
        { email: 'bob@example.com', name: 'Bob Writer' },
        { email: 'charlie@example.com', name: 'Charlie Shopper' },
        { email: 'diana@example.com', name: 'Diana Explorer' },
        { email: 'admin@example.com', name: 'Admin User' }
    ];

    toggleDropdown(): void {
        this.showDropdown.update(v => !v);
        if (!this.showDropdown()) {
            this.showCustomInput.set(false);
        }
    }

    selectPresetUser(user: { email: string; name: string }): void {
        this.userContext.setUser(user.email, user.name);
        this.showDropdown.set(false);
    }

    showCustomForm(): void {
        this.showCustomInput.set(true);
    }

    submitCustomUser(): void {
        const email = this.customEmail().trim();
        if (email) {
            this.userContext.setUser(email, this.customName().trim() || undefined);
            this.customEmail.set('');
            this.customName.set('');
            this.showCustomInput.set(false);
            this.showDropdown.set(false);
        }
    }

    logout(): void {
        this.userContext.clearUser();
        this.showDropdown.set(false);
    }

    closeDropdownOnClickOutside(event: MouseEvent): void {
        // Close dropdown when clicking outside
        const target = event.target as HTMLElement;
        if (!target.closest('.user-context-container')) {
            this.showDropdown.set(false);
        }
    }
}
