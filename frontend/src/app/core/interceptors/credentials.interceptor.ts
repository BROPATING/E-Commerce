import { inject, Injectable } from '@angular/core';
import {
    HttpRequest, HttpHandler, HttpEvent,
    HttpInterceptor, HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class CredentialsInterceptor implements HttpInterceptor {

    // New Method without using contructor
    private authService = inject(AuthService);
    private router = inject(Router);

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Clone the request and add withCredentials
        // We must clone because HttpRequest objects are immutable(cannot change) so to edit the cookies perfect copy is send
        const credentialed = req.clone({ withCredentials: true });

        return next.handle(credentialed).pipe(
            catchError((error: HttpErrorResponse) => {
                // 401 means session expired or cookie invalid
                // Clear local state and redirect to login
                if (error.status === 401) { // Forbidden -> don't have permission (admin access)
                    this.authService.setUser(null as any);
                    this.router.navigate(['/auth/login']);
                }

                // 403 means account locked
                if (error.status === 403) {
                    this.authService.setUser(null as any);
                    this.router.navigate(['/auth/login'], {
                        queryParams: { reason: 'locked' },
                    });
                }

                return throwError(() => error);
            })
        );
    }
}