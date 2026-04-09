import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdersRoutingModule } from './orders-routing-module';
import { OrderDetailComponent } from './order-detail/order-detail.component';
import { OrderListComponent } from './order-list/order-list.component';


@NgModule({
  declarations: [
    OrderListComponent,
    OrderDetailComponent,
  ],
  imports: [
    CommonModule,
    OrdersRoutingModule
  ],
  exports: [OrderDetailComponent]
})
export class OrdersModule { }
