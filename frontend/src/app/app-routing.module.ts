import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth-guard';
import { AdminGuard } from './core/guards/admin-guard';
import { GuestGuard } from './core/guards/guest-guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/products/products-module')
        .then(m => m.ProductsModule),
  },
  {
    path: 'auth',
    canActivate: [GuestGuard],
    loadChildren: () =>
      import('./features/auth/auth-module')
        .then(m => m.AuthModule),
  },
  {
    path: 'cart',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/cart/cart-module')
        .then(m => m.CartModule),
  },
  {
    path: 'orders',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/orders/orders-module')
        .then(m => m.OrdersModule),
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/profile/profile-module')
        .then(m => m.ProfileModule),
  },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    loadChildren: () =>
      import('./admin/admin-module')
        .then(m => m.AdminModule),
  },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'top',
  })],
  exports: [RouterModule],
})
export class AppRoutingModule {}