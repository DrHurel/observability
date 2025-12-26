import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-create',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.scss'
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
