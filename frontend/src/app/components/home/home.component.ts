import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-home',
    imports: [CommonModule, RouterLink],
    template: `
    <div class="home-container">
      <div class="hero">
        <h1>Observability Application</h1>
        <p class="subtitle">Manage Users and Products with Real-time Monitoring</p>
      </div>

      <div class="features-grid">
        <div class="feature-card">
          <div class="icon">👥</div>
          <h2>User Management</h2>
          <p>Create and manage users with validation. View all registered users in the system.</p>
          <div class="card-actions">
            <a routerLink="/users" class="btn btn-primary">View Users</a>
            <a routerLink="/users/create" class="btn btn-secondary">Create User</a>
          </div>
        </div>

        <div class="feature-card">
          <div class="icon">📦</div>
          <h2>Product Management</h2>
          <p>Add, edit, and delete products. Track product information including prices and expiration dates.</p>
          <div class="card-actions">
            <a routerLink="/products" class="btn btn-primary">View Products</a>
            <a routerLink="/products/create" class="btn btn-secondary">Add Product</a>
          </div>
        </div>

        <div class="feature-card">
          <div class="icon">📊</div>
          <h2>Monitoring</h2>
          <p>Real-time observability with Kafka event streaming, ClickHouse metrics, and Grafana dashboards.</p>
          <div class="card-actions">
            <a href="http://localhost:3000" target="_blank" class="btn btn-primary">Open Grafana</a>
            <a href="http://localhost:8080/actuator/health" target="_blank" class="btn btn-secondary">Health Check</a>
          </div>
        </div>
      </div>

      <div class="info-section">
        <h3>Technical Stack</h3>
        <div class="tech-tags">
          <span class="tag">Angular 21</span>
          <span class="tag">Spring Boot</span>
          <span class="tag">MongoDB</span>
          <span class="tag">Kafka</span>
          <span class="tag">ClickHouse</span>
          <span class="tag">Grafana</span>
          <span class="tag">Docker</span>
        </div>
      </div>

      <div class="api-section">
        <h3>API Endpoints</h3>
        <div class="endpoints">
          <div class="endpoint-group">
            <h4>Users</h4>
            <ul>
              <li><code>GET /api/users</code> - List all users</li>
              <li><code>POST /api/users</code> - Create user</li>
              <li><code>GET /api/users/:id</code> - Get user by ID</li>
            </ul>
          </div>
          <div class="endpoint-group">
            <h4>Products</h4>
            <ul>
              <li><code>GET /api/products</code> - List all products</li>
              <li><code>POST /api/products</code> - Add product</li>
              <li><code>PUT /api/products/:id</code> - Update product</li>
              <li><code>DELETE /api/products/:id</code> - Delete product</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .home-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero {
      text-align: center;
      padding: 3rem 0;
      margin-bottom: 3rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
    }

    .hero h1 {
      margin: 0 0 1rem 0;
      font-size: 2.5rem;
    }

    .subtitle {
      font-size: 1.25rem;
      opacity: 0.9;
      margin: 0;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .feature-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h2 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.5rem;
    }

    .feature-card p {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .card-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
      font-size: 0.9rem;
      display: inline-block;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #5a6268;
    }

    .info-section, .api-section {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .info-section h3, .api-section h3 {
      margin: 0 0 1.5rem 0;
      color: #333;
    }

    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .tag {
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .endpoints {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }

    .endpoint-group h4 {
      margin: 0 0 1rem 0;
      color: #007bff;
    }

    .endpoint-group ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .endpoint-group li {
      padding: 0.5rem 0;
      color: #666;
    }

    code {
      background: #f5f5f5;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
    }

    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }

      .subtitle {
        font-size: 1rem;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent { }
