import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/Interface';

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  /**
   * BehaviorSubject holds the current authenticated user.
   * null  = not logged in / session not yet restored
   * User  = authenticated
   *
   * Components subscribe to currentUser$ and react automatically
   * when auth state changes — login, logout, profile update.
   */
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  // ── Session ───────────────────────────────────────────────────────────────

  /**
   * Called once in AppComponent.ngOnInit to restore the session.
   * Hits GET /auth/me — if the HTTP-only cookie is still valid
   * the server returns the user profile and we populate the subject.
   */
  initSession(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(
      `${this.apiUrl}/auth/me`,
      { withCredentials: true },
    ).pipe(
      tap(res => this.currentUserSubject.next(res.user))
    );
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/register`,
      { name, email, password },
      { withCredentials: true },
    );
  }

  login(email: string, password: string): Observable<{ message: string; user: User }> {
    return this.http.post<{ message: string; user: User }>(
      `${this.apiUrl}/auth/login`,
      { email, password },
      { withCredentials: true },
    ).pipe(
      tap(res => this.currentUserSubject.next(res.user))
    );
  }

  logout(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/logout`,
      {},
      { withCredentials: true },
    ).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.router.navigate(['/']);
      })
    );
  }

  // ── Password ──────────────────────────────────────────────────────────────

  forgotPassword(email: string): Observable<{ message: string; resetCode: string }> {
    return this.http.post<{ message: string; resetCode: string }>(
      `${this.apiUrl}/auth/forgot-password`,
      { email },
      { withCredentials: true },
    );
  }

  resetPassword(email: string, code: string, newPassword: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/reset-password`,
      { email, code, newPassword },
      { withCredentials: true },
    );
  }

  /**
   * Changes password while logged in.
   * Requires the current password for verification.
   * Backend invalidates all sessions after success —
   * the interceptor catches the resulting 401 and redirects to login.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/profile/changePassword`,
      { currentPassword, newPassword },
      { withCredentials: true },
    );
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  /**
   * Updates the current user's name and email.
   * On success, updates the BehaviorSubject so the navbar
   * and any other subscribers reflect the new name immediately.
   */
  updateProfile(name: string, email: string): Observable<{ message: string; user: User }> {
    return this.http.patch<{ message: string; user: User }>(
      `${this.apiUrl}/profile/update`,
      { name, email },
      { withCredentials: true },
    ).pipe(
      tap(res => this.currentUserSubject.next(res.user))
    );
  }

  // ── Synchronous getters ───────────────────────────────────────────────────

  /**
   * Synchronous snapshot of the current user.
   * Use currentUser$ (Observable) when you need reactive updates.
   * Use currentUser (getter) for one-time reads in guards or form init.
   */
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  get isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'admin';
  }

  get isCustomer(): boolean {
    return this.currentUserSubject.value?.role === 'customer';
  }

  /**
   * Used by the interceptor to clear state on 401/403.
   * Not for general use — call logout() instead when the user
   * initiates the action themselves.
   */
  setUser(user: User | null): void {
    this.currentUserSubject.next(user);
  }
}