import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,        // Provides *ngIf
    ReactiveFormsModule, // Provides [formGroup] and formControlName
    RouterModule       // Provides routerLink
  ],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  form: FormGroup;
  errorMessage = '';
  lockedMessage = '';
  loading = false;

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

  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

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