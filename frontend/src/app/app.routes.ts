import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserCreateComponent } from './components/user-create/user-create.component';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductFormComponent } from './components/product-form/product-form.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'users', component: UserListComponent },
    { path: 'users/create', component: UserCreateComponent },
    { path: 'products', component: ProductListComponent },
    { path: 'products/create', component: ProductFormComponent },
    { path: 'products/edit/:id', component: ProductFormComponent },
    { path: '**', redirectTo: '' }
];
