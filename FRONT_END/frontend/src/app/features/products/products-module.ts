import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductsRoutingModule } from './products-routing-module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HomeComponent } from './home/home.component';
import { ProductListComponent } from './product-list/product-list.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [
    HomeComponent,
    ProductListComponent,
    ProductDetailComponent,
    ProductCardComponent,
  ],
  imports: [
    RouterModule,
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    ProductsRoutingModule,
  ]
})
export class ProductsModule { }
