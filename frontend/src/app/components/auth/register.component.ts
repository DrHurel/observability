import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserContextService } from '../../services/user-context.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent {
    private readonly router = inject(Router);
    private readonly userContext = inject(UserContextService);
    private readonly userService = inject(UserService);

    name = '';
    email = '';
    password = '';
    age: number = 25;
    loading = signal(false);
    error = signal<string | null>(null);
    success = signal<string | null>(null);

    onRegister(): void {
        if (!this.name || !this.email || !this.password || !this.age) {
            this.error.set('Please fill in all fields');
            return;
        }

        if (this.age < 13) {
            this.error.set('You must be at least 13 years old');
            return;
        }

        this.loading.set(true);
        this.error.set(null);
        this.success.set(null);

        const user: User = {
            name: this.name,
            email: this.email,
            password: this.password,
            age: this.age
        };

        this.userService.createUser(user).subscribe({
            next: (createdUser) => {
                this.success.set('Account created successfully! Logging you in...');
                this.loading.set(false);

                // Auto-login after registration
                setTimeout(() => {
                    this.userContext.login(createdUser.email, createdUser.name, createdUser.id);
                    this.router.navigate(['/']);
                }, 1500);
            },
            error: (err) => {
                this.error.set(err.error?.message || 'Registration failed. Please try again.');
                this.loading.set(false);
            }
        });
    }
}
