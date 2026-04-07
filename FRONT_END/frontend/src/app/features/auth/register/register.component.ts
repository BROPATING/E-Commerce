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

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,        // Provides *ngIf
    ReactiveFormsModule, // Provides [formGroup] and formControlName
    RouterModule         // Provides routerLink
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  form: FormGroup;
  errorMessage = '';
  successMessage = '';
  loading = false;

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
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
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