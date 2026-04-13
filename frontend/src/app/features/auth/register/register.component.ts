import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

/**
 * Custom validator — ensures password and confirmPassword fields match.
 * Applied at the FormGroup level so it has access to both controls.
 */
function passwordMatchValidator(group: AbstractControl) {
  const password        = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

/**
 * RegisterComponent
 * -----------------
 * Handles user registration flow:
 * - Builds and validates registration form
 * - Submits registration request to AuthService
 * - Displays success or error messages
 * - Redirects to login page on success
 */
@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  form: FormGroup;
  errorMessage = '';
  successMessage = '';
  loading = false;

  showPassword = false;
  showConfirm  = false;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      name:            ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email:           ['', [Validators.required, Validators.email]],
      password:        ['', [Validators.required, Validators.minLength(8), Validators.pattern(/[A-Z]/), Validators.pattern(/[0-9]/)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordMatchValidator }); 
  }

  get name()            { return this.form.get('name')!; }
  get email()           { return this.form.get('email')!; }
  get password()        { return this.form.get('password')!; }
  get confirmPassword() { return this.form.get('confirmPassword')!; }

  /**
   * Calculates password strength for the UI bars
   */
  get passwordStrength() {
    const val = this.password.value || '';
    if (!val) return { level: 0, label: '', color: 'transparent' };
    
    let points = 0;
    if (val.length >= 8) points++;
    if (/[A-Z]/.test(val)) points++;
    if (/[0-9]/.test(val)) points++;
    if (/[!@#$%^&*]/.test(val)) points++;

    const map = [
      { label: 'Weak', color: '#f43f5e', level: 1 },
      { label: 'Fair', color: '#fb923c', level: 2 },
      { label: 'Good', color: '#38bdf8', level: 3 },
      { label: 'Strong', color: '#10b981', level: 4 }
    ];
    
    return map[points - 1] || map[0];
  }

  /**
   * Submit registration form
   * - Validates form
   * - Calls AuthService.register
   * - Shows success or error messages
   * - Redirects to login page on success
   */
  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';

    this.authService.register(
      this.name.value,
      this.email.value,
      this.password.value,
    ).subscribe({
      next: () => {
        this.successMessage = 'Account created! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 200);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error
          || err.error?.errors?.[0]?.msg
          || 'Registration failed. Please try again.';
      },
    });
  }
}