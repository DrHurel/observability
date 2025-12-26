import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserContextService } from '../../services/user-context.service';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    private readonly router = inject(Router);
    private readonly userContext = inject(UserContextService);
    private readonly userService = inject(UserService);

    email = '';
    password = '';
    loading = signal(false);
    error = signal<string | null>(null);

    onLogin(): void {
        if (!this.email || !this.password) {
            this.error.set('Please enter email and password');
            return;
        }

        this.loading.set(true);
        this.error.set(null);

        // Try to find user by email
        this.userService.getUserByEmail(this.email).subscribe({
            next: (user) => {
                if (user) {
                    const isAdmin = this.email.includes('admin');
                    this.userContext.login(user.email, user.name, user.id, isAdmin);
                    this.router.navigate(['/']);
                } else {
                    this.error.set('User not found. Please register first.');
                }
                this.loading.set(false);
            },
            error: () => {
                // User not found, try quick login anyway for demo
                this.quickLogin(this.email, this.email.split('@')[0]);
            }
        });
    }

    quickLogin(email: string, name: string, isAdmin = false): void {
        this.userContext.login(email, name, undefined, isAdmin);
        this.router.navigate(['/']);
    }
}
