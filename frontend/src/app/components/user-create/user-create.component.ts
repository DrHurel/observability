import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-user-create',
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="container">
      <h2>Create New User</h2>

      @if (successMessage()) {
        <div class="success-message">{{ successMessage() }}</div>
      }

      @if (errorMessage()) {
        <div class="error-message">{{ errorMessage() }}</div>
      }

      <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="user-form">
        <div class="form-group">
          <label for="name">Name *</label>
          <input
            id="name"
            type="text"
            formControlName="name"
            placeholder="Enter name"
            [class.invalid]="userForm.get('name')?.invalid && userForm.get('name')?.touched"
          />
          @if (userForm.get('name')?.invalid && userForm.get('name')?.touched) {
            <span class="error-text">Name is required</span>
          }
        </div>

        <div class="form-group">
          <label for="email">Email *</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="Enter email"
            [class.invalid]="userForm.get('email')?.invalid && userForm.get('email')?.touched"
          />
          @if (userForm.get('email')?.invalid && userForm.get('email')?.touched) {
            <span class="error-text">Valid email is required</span>
          }
        </div>

        <div class="form-group">
          <label for="age">Age *</label>
          <input
            id="age"
            type="number"
            formControlName="age"
            placeholder="Enter age"
            [class.invalid]="userForm.get('age')?.invalid && userForm.get('age')?.touched"
          />
          @if (userForm.get('age')?.invalid && userForm.get('age')?.touched) {
            <span class="error-text">Age must be 0 or greater</span>
          }
        </div>

        <div class="form-group">
          <label for="password">Password *</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            placeholder="Enter password"
            [class.invalid]="userForm.get('password')?.invalid && userForm.get('password')?.touched"
          />
          @if (userForm.get('password')?.invalid && userForm.get('password')?.touched) {
            <span class="error-text">Password is required</span>
          }
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid || submitting()">
            {{ submitting() ? 'Creating...' : 'Create User' }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
    }

    h2 {
      margin-bottom: 2rem;
      color: #333;
    }

    .success-message, .error-message {
      padding: 1rem;
      margin-bottom: 1.5rem;
      border-radius: 4px;
    }

    .success-message {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .error-message {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .user-form {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    input:focus {
      outline: none;
      border-color: #007bff;
    }

    input.invalid {
      border-color: #dc3545;
    }

    .error-text {
      display: block;
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }
  `]
})
export class UserCreateComponent {
    private readonly fb = inject(FormBuilder);
    private readonly userService = inject(UserService);
    private readonly router = inject(Router);

    submitting = signal(false);
    successMessage = signal<string | null>(null);
    errorMessage = signal<string | null>(null);

    userForm = this.fb.nonNullable.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        age: [0, [Validators.required, Validators.min(0)]],
        password: ['', Validators.required]
    });

    onSubmit() {
        if (this.userForm.valid) {
            this.submitting.set(true);
            this.errorMessage.set(null);
            this.successMessage.set(null);

            this.userService.createUser(this.userForm.getRawValue()).subscribe({
                next: () => {
                    this.successMessage.set('User created successfully!');
                    this.submitting.set(false);
                    setTimeout(() => {
                        this.router.navigate(['/users']);
                    }, 1500);
                },
                error: (err) => {
                    this.errorMessage.set(err.error?.message || 'Failed to create user. Please try again.');
                    this.submitting.set(false);
                    console.error('Error creating user:', err);
                }
            });
        }
    }

    cancel() {
        this.router.navigate(['/users']);
    }
}
