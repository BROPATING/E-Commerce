import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

/**
 * LoginComponent
 * --------------
 * Handles user login flow:
 * - Builds and validates login form
 * - Submits credentials to AuthService
 * - Displays error or account lock messages
 * - Redirects users based on role (admin vs customer)
 */
@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  form: FormGroup;
  errorMessage = '';
  lockedMessage = '';
  loading = false;

  showPassword = false;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    // Check if redirected here due to account lock
    this.route.queryParams.subscribe(params => {
      if (params['reason'] === 'locked') {
        this.lockedMessage = 'Your account has been locked. Please contact support.';
      }
    });
  }

  /** Getter for email control */
  get email() { return this.form.get('email')!; }

  /** Getter for password control */
  get password() { return this.form.get('password')!; }

  /**
   * Submit login form
   * - Validates form
   * - Calls AuthService.login
   * - Redirects admin users to admin panel
   * - Redirects customers to homepage
   * - Displays error message on failure
   */
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';

    this.authService.login(
      this.email.value,
      this.password.value,
    ).subscribe({
      next: (res) => {
        // Redirect admin to admin panel, customers to homepage
        if (res.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Login failed. Please try again.';
      },
    });
  }
}