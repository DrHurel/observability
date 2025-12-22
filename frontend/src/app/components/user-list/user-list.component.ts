import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
    selector: 'app-user-list',
    imports: [CommonModule, RouterLink],
    template: `
    <div class="container">
      <div class="header">
        <h2>Users</h2>
        <a routerLink="/users/create" class="btn btn-primary">Create New User</a>
      </div>

      @if (loading()) {
        <div class="loading">Loading users...</div>
      }

      @if (error()) {
        <div class="error">{{ error() }}</div>
      }

      @if (users().length === 0 && !loading() && !error()) {
        <div class="empty-state">
          <p>No users found. Create your first user!</p>
        </div>
      }

      @if (users().length > 0) {
        <div class="users-grid">
          @for (user of users(); track user.id) {
            <div class="user-card">
              <h3>{{ user.name }}</h3>
              <p><strong>Email:</strong> {{ user.email }}</p>
              <p><strong>Age:</strong> {{ user.age }}</p>
              <p><strong>ID:</strong> {{ user.id }}</p>
            </div>
          }
        </div>
      }
    </div>
  `,
    styles: [`
    .container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    h2 {
      margin: 0;
      color: #333;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .loading, .error, .empty-state {
      text-align: center;
      padding: 2rem;
      border-radius: 8px;
    }

    .error {
      background-color: #fee;
      color: #c33;
      border: 1px solid #fcc;
    }

    .empty-state {
      background-color: #f8f9fa;
      color: #666;
    }

    .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .user-card {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .user-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .user-card h3 {
      margin: 0 0 1rem 0;
      color: #007bff;
    }

    .user-card p {
      margin: 0.5rem 0;
      color: #666;
    }
  `]
})
export class UserListComponent implements OnInit {
    private readonly userService = inject(UserService);

    users = signal<User[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);

    ngOnInit() {
        this.loadUsers();
    }

    loadUsers() {
        this.loading.set(true);
        this.error.set(null);

        this.userService.getAllUsers().subscribe({
            next: (users) => {
                this.users.set(users);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set('Failed to load users. Please try again.');
                this.loading.set(false);
                console.error('Error loading users:', err);
            }
        });
    }
}
