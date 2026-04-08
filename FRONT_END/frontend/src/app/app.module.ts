import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app';
import { CredentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { ProductCardComponent } from './shared/components/product-card/product-card.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProfilePageComponent } from './features/profile/profile-page/profile-page.component';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ProductsModule } from './features/products/products-module';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule,
    HttpClientModule,
    ReactiveFormsModule,
    ProductsModule,
    AppRoutingModule,
    CommonModule,
    FormsModule
  ],
  providers: [
    {
      provide:  HTTP_INTERCEPTORS,
      useClass: CredentialsInterceptor,
      multi:    true,
    },
  ],
  exports: [
    NavbarComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}