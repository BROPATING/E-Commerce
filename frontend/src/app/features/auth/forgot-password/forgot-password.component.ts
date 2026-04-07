import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  // step 1 = enter email, step 2 = enter code + new password
  step = 1;

  emailForm: FormGroup;
  resetForm: FormGroup;

  errorMessage = '';
  successMessage = '';
  loading = false;

  // The reset code returned by the mock flow
  displayedCode = '';
  submittedEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.resetForm = this.fb.group({
      code:        ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get email()       { return this.emailForm.get('email')!; }
  get code()        { return this.resetForm.get('code')!; }
  get newPassword() { return this.resetForm.get('newPassword')!; }

  onRequestCode(): void {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';
    this.submittedEmail = this.email.value;

    this.authService.forgotPassword(this.email.value).subscribe({
      next: (res) => {
        this.loading = false;
        this.displayedCode = res.resetCode;
        this.step = 2;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Request failed. Please try again.';
      },
    });
  }

  onResetPassword(): void {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    this.loading = true;
    this.errorMessage = '';

    this.authService.resetPassword(
      this.submittedEmail,
      this.code.value,
      this.newPassword.value,
    ).subscribe({
      next: () => {
        this.successMessage = 'Password reset successfully. Redirecting to login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Reset failed. Please try again.';
      },
    });
  }
}