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
    template: `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>🛒 ShopObserve</h1>
                    <p>Welcome back! Please login to continue.</p>
                </div>

                <form (ngSubmit)="onLogin()" class="auth-form">
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

                    <div class="form-group">
                        <label for="password">Password</label>
                        <input 
                            type="password" 
                            id="password"
                            [(ngModel)]="password"
                            name="password"
                            placeholder="Enter your password"
                            required>
                    </div>

                    @if (error()) {
                        <div class="error-message">{{ error() }}</div>
                    }

                    <button type="submit" class="btn-primary" [disabled]="loading()">
                        @if (loading()) {
                            <span class="spinner"></span> Logging in...
                        } @else {
                            Login
                        }
                    </button>
                </form>

                <div class="auth-footer">
                    <p>Don't have an account? <a routerLink="/register">Register here</a></p>
                </div>

                <div class="demo-users">
                    <p>Quick Login (Demo):</p>
                    <div class="demo-buttons">
                        <button (click)="quickLogin('alice@example.com', 'Alice')">Alice (Buyer)</button>
                        <button (click)="quickLogin('bob@example.com', 'Bob')">Bob (Seller)</button>
                        <button (click)="quickLogin('admin@example.com', 'Admin', true)">Admin</button>
                    </div>
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
            max-width: 420px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .auth-header {
            text-align: center;
            margin-bottom: 2rem;

            h1 {
                font-size: 2rem;
                color: #333;
                margin-bottom: 0.5rem;
            }

            p {
                color: #666;
            }
        }

        .form-group {
            margin-bottom: 1.5rem;

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

        .demo-users {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            text-align: center;

            p {
                font-size: 0.85rem;
                color: #666;
                margin-bottom: 0.75rem;
            }
        }

        .demo-buttons {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            justify-content: center;

            button {
                padding: 0.5rem 0.75rem;
                border: 1px solid #ddd;
                background: white;
                border-radius: 6px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.2s;

                &:hover {
                    border-color: #667eea;
                    color: #667eea;
                }
            }
        }
    `]
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
