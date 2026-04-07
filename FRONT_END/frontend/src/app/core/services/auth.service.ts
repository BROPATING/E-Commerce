import { inject, Inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.prod';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../../shared/User';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})

export class AuthService {
  // Restricting the overwriting
  private readonly apiUrl = environment.apiUrl;

  /**
   * BehaviorSubject holds the current user state.
   * 
   * null  = not logged in 
   * why null => If you only wrote <User>, TypeScript would complain the moment 
   * you tried to start the app without a user already logged in. Since a user has to 
   * log in after the app starts, you must allow it to be null at the beginning.
   * 
   * User  = logged in
   *
   * (null) BehaviourSubject requires the initial value
   * 
   * BehaviorSubject always has a current value and replays it
   * to any new subscriber immediately — so a component that
   * subscribes after login still gets the current user.
   */
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private http = inject(HttpClient);
  private router = inject(Router);

  /**
   * Called once on app startup (in AppComponent.ngOnInit).
   * Attempts to restore the session by calling /auth/me.
   * If the cookie is still valid, populates currentUser$.
   */
  initSession(): Observable<any> {
    return this.http.get<{ user: User }>(`${this.apiUrl}/auth/me`, {
      withCredentials: true,
    }).pipe(
      tap(res => this.currentUserSubject.next(res.user))
    );
  }

  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/register`,
      { name, email, password },
      { withCredentials: true },
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<{ user: User }>(
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

  //The "Authorized Gateway" to change the state.
  setUser(user: User): void {
    this.currentUserSubject.next(user); //The "Broadcast" button.
  }

}
