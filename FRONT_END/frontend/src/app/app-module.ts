import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app';
import { CredentialsInterceptor } from './core/interceptors/credentials.interceptor';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    AppComponent
  ],
  providers: [
    {
      provide:  HTTP_INTERCEPTORS,
      useClass: CredentialsInterceptor,
      multi:    true,
    },
  ],
  bootstrap: [],
})
export class AppModule {}