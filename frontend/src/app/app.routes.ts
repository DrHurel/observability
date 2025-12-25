import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserCreateComponent } from './components/user-create/user-create.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { ProfileListComponent } from './components/profile-list/profile-list.component';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { MarketplaceComponent } from './components/marketplace/marketplace.component';
import { MyShopComponent } from './components/my-shop/my-shop.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    // Auth routes
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    // Shopping routes
    { path: 'shop', component: MarketplaceComponent },
    { path: 'sell', component: MyShopComponent },
    // Admin routes
    { path: 'admin', component: AdminDashboardComponent },
    // Legacy management routes
    { path: 'users', component: UserListComponent },
    { path: 'users/create', component: UserCreateComponent },
    { path: 'products', component: ProductListComponent },
    { path: 'products/create', component: ProductFormComponent },
    { path: 'products/edit/:id', component: ProductFormComponent },
    { path: 'profiles', component: ProfileListComponent },
    { path: '**', redirectTo: '' }
];
