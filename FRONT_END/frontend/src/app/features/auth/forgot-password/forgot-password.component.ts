import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * ForgotPasswordComponent
 * -----------------------
 * Handles the multi-step "forgot password" flow:
 * - Step 1: Request reset code via email
 * - Step 2: Enter reset code + new password
 * - Step 3: Success confirmation
 * Includes:
 * - Password strength indicator
 * - Password match validation
 * - Smooth animations between steps
 */
@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
  animations: [
    trigger('stepAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class ForgotPasswordComponent {
  step = 1;

  emailForm: FormGroup;

  resetForm: FormGroup;

  emailError = '';
  resetError = '';

  emailLoading = false;
  resetLoading = false;

  displayedCode = '';

  submittedEmail = '';

  showNewPwd = false;
  showConfirmPwd = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    // Initialize reset form with password match validator
    this.resetForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.pattern('^[0-9]*$')]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).*$/)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Custom Validator — ensures newPassword and confirmPassword match
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword');
    const confirm = control.get('confirmPassword');
    return password && confirm && password.value !== confirm.value ? { passwordMismatch: true } : null;
  }

  // Getters for form controls
  get emailCtrl() { return this.emailForm.get('email')!; }
  get codeCtrl() { return this.resetForm.get('code')!; }
  get newPassword() { return this.resetForm.get('newPassword')!; }
  get confirmPassword() { return this.resetForm.get('confirmPassword')!; }

  /**
   * Password strength indicator
   * Returns label, level, and color based on complexity
   */
  get passwordStrength() {
    const pwd = this.newPassword.value ?? '';
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { label: 'Weak', level: 1, color: '#ef4444' };
    if (score <= 2) return { label: 'Fair', level: 2, color: '#f59e0b' };
    if (score <= 3) return { label: 'Good', level: 3, color: '#3b82f6' };
    return { label: 'Strong', level: 4, color: '#10b981' };
  }

  /**
   * Step 1: Request reset code
   * - Validates email form
   * - Calls AuthService.forgotPassword
   * - Displays reset code (mock flow)
   * - Advances to step 2
   */
  onRequestCode(): void {
    if (this.emailForm.invalid) { this.emailCtrl.markAsTouched(); return; }

    this.emailLoading = true;
    this.emailError = '';
    this.submittedEmail = this.emailCtrl.value;

    this.authService.forgotPassword(this.submittedEmail).subscribe({
      next: (res) => {
        this.emailLoading = false;
        // Ensure it is a string so .split('') works in the HTML
        this.displayedCode = String(res.resetCode);
        this.step = 2;
      },
      error: (err) => {
        this.emailLoading = false;
        this.emailError = err.error?.error || 'Request failed. Try again.';
      },
    });
  }

  /**
   * Step 2: Reset password
   * - Validates reset form
   * - Calls AuthService.resetPassword
   * - Advances to success step
   */
  onResetPassword(): void {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }

    this.resetLoading = true;
    this.resetError = '';

    this.authService.resetPassword(
      this.submittedEmail,
      this.codeCtrl.value,
      this.newPassword.value,
    ).subscribe({
      next: () => {
        this.resetLoading = false;
        this.step = 3; // Move to success step
      },
      error: (err) => {
        this.resetLoading = false;
        this.resetError = err.error?.error || 'Reset failed. Try again.';
      },
    });
  }

  // Navigation Methods
  /** Return to step 1 and reset form */
  goBackToStep1(): void {
    this.step = 1;
    this.resetForm.reset();
  }

  /** Navigate to login page */
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  trackByIndex(index: number):number{
    return index;
  }
}