import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing-module';
import { NgModule } from '@angular/core';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AdminProductsComponent } from './components/admin-products/admin-products.component';
import { AdminProductFormComponent } from './components/admin-product-form/admin-product-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminOrderComponent } from './components/admin-order/admin-order.component';
import { AdminCustomersComponent } from './components/admin-customer/admin-customer.component';

/**
 * AdminModule is lazy loaded — its code is only downloaded
 * when a user navigates to /admin for the first time.
 * The AdminGuard prevents non-admins from triggering this load.
 */
@NgModule({
  declarations: [
    AdminDashboardComponent,
    AdminProductsComponent,
    AdminProductFormComponent,
    AdminCustomersComponent,
    AdminOrderComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    AdminRoutingModule,
  ],
})
export class AdminModule {}