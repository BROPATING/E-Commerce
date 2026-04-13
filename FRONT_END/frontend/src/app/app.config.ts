import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CredentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { routes } from './features/auth/auth-routing-module';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideBrowserGlobalErrorListeners(),
//     provideRouter(routes)
//   ]
// };

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    // 1. Setup Routing
    provideRouter(routes),

    // 2. Setup HttpClient with support for Class-based Interceptors
    provideHttpClient(withInterceptorsFromDi()), 
    provideAnimationsAsync(),
    // 3. Register your CredentialsInterceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CredentialsInterceptor,
      multi: true,
    },

  ]
};
