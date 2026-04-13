import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AdminProductsComponent } from './components/admin-products/admin-products.component';
import { AdminProductFormComponent } from './components/admin-product-form/admin-product-form.component';
import { AdminCustomersComponent } from './components/admin-customer/admin-customer.component';
import { AdminOrderComponent } from './components/admin-order/admin-order.component';
import { OrderDetailComponent } from '../features/orders/order-detail/order-detail.component';
import { AdminOrderDetailComponent } from './components/admin-order-detail/admin-order-detail.component';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    children: [
      { path: '',          redirectTo: 'products', pathMatch: 'full' },
      { path: 'products',  component: AdminProductsComponent },
      { path: 'products/new',     component: AdminProductFormComponent },
      { path: 'products/:id/edit', component: AdminProductFormComponent },
      { path: 'customers', component: AdminCustomersComponent },
      { path: 'orders',    component: AdminOrderComponent},
      { path: 'orders/:id', component: AdminOrderDetailComponent}
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}