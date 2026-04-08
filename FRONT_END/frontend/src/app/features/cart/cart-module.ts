import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CartRoutingModule } from './cart-routing-module';
import { RouterLink, RouterModule, Routes } from '@angular/router';
import { CartPageComponent } from './cart-page/cart-page.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';

const routes: Routes = [
  { path: '',             component: CartPageComponent },
  { path: 'checkout',     component: CheckoutComponent },
  { path: 'confirmation', component: OrderConfirmationComponent },
];

@NgModule({
  declarations: [
    CartPageComponent,
    CheckoutComponent,
    OrderConfirmationComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    RouterModule.forChild(routes),
    CartRoutingModule,
    RouterLink,
  ]
})
export class CartModule { }
