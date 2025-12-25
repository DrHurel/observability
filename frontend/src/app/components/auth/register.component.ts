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
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>🛒 Join ShopObserve</h1>
                    <p>Create your account to start buying and selling!</p>
                </div>

                <form (ngSubmit)="onRegister()" class="auth-form">
                    <div class="form-group">
                        <label for="name">Full Name</label>
                        <input 
                            type="text" 
                            id="name"
                            [(ngModel)]="name"
                            name="name"
                            placeholder="Enter your full name"
                            required>
                    </div>

                    <div class="form-group">
                        <label for="email">Email</label>
                        <input 
                            type="email" 
                            id="email"
                            [(ngModel)]="email"
                            name="email"
                            placeholder="Enter your email"
                            required>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input 
                                type="password" 
                                id="password"
                                [(ngModel)]="password"
                                name="password"
                                placeholder="Create password"
                                required>
                        </div>
                        <div class="form-group">
                            <label for="age">Age</label>
                            <input 
                                type="number" 
                                id="age"
                                [(ngModel)]="age"
                                name="age"
                                placeholder="Your age"
                                min="13"
                                required>
                        </div>
                    </div>

                    @if (error()) {
                        <div class="error-message">{{ error() }}</div>
                    }

                    @if (success()) {
                        <div class="success-message">{{ success() }}</div>
                    }

                    <button type="submit" class="btn-primary" [disabled]="loading()">
                        @if (loading()) {
                            <span class="spinner"></span> Creating Account...
                        } @else {
                            Create Account
                        }
                    </button>
                </form>

                <div class="auth-footer">
                    <p>Already have an account? <a routerLink="/login">Login here</a></p>
                </div>

                <div class="benefits">
                    <h3>Why join ShopObserve?</h3>
                    <ul>
                        <li>🛍️ Buy from thousands of sellers</li>
                        <li>💰 Sell your own products</li>
                        <li>📊 Track your shopping behavior</li>
                        <li>🎯 Get personalized recommendations</li>
                    </ul>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .auth-container {
            min-height: calc(100vh - 140px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .auth-card {
            background: white;
            border-radius: 16px;
            padding: 2.5rem;
            width: 100%;
            max-width: 480px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .auth-header {
            text-align: center;
            margin-bottom: 2rem;

            h1 {
                font-size: 1.75rem;
                color: #333;
                margin-bottom: 0.5rem;
            }

            p {
                color: #666;
            }
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        .form-group {
            margin-bottom: 1.25rem;

            label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
                color: #333;
            }

            input {
                width: 100%;
                padding: 0.875rem 1rem;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 1rem;
                transition: border-color 0.3s;

                &:focus {
                    outline: none;
                    border-color: #667eea;
                }
            }
        }

        .error-message {
            background: #fee;
            color: #c00;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }

        .success-message {
            background: #efe;
            color: #060;
            padding: 0.75rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }

        .btn-primary {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;

            &:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            &:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
        }

        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .auth-footer {
            text-align: center;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid #eee;

            a {
                color: #667eea;
                font-weight: 500;
            }
        }

        .benefits {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;

            h3 {
                font-size: 0.95rem;
                color: #333;
                margin-bottom: 0.75rem;
            }

            ul {
                list-style: none;
                padding: 0;
                margin: 0;

                li {
                    padding: 0.4rem 0;
                    font-size: 0.9rem;
                    color: #666;
                }
            }
        }

        @media (max-width: 500px) {
            .form-row {
                grid-template-columns: 1fr;
            }
        }
    `]
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
