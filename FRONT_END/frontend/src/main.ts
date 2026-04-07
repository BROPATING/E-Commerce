import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CredentialsInterceptor } from './app/core/interceptors/credentials.interceptor';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// bootstrapApplication(AppComponent, {
//   providers: [
//     // This replaces HttpClientModule
//     provideHttpClient(
//       withInterceptorsFromDi() 
//     ),
//     // This replaces your HTTP_INTERCEPTORS provider
//     {
//       provide: HTTP_INTERCEPTORS,
//       useClass: CredentialsInterceptor,
//       multi: true,
//     },
//     // This replaces AppRoutingModule
//     provideRouter(routes),
//   ],
// }).catch((err) => console.error(err));
