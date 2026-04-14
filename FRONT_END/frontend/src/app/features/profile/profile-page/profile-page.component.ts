import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { User } from '../../../shared/Interface';
import Swal from 'sweetalert2';
// ── Custom validator ──────────────────────────────────────────────────────────

/**
 * Cross-field validator that ensures newPassword and confirmPassword match.
 * Applied at the FormGroup level so it has access to both controls.
 */
function passwordMatchValidator(group: AbstractControl) {
  const np = group.get('newPassword')?.value;
  const cp = group.get('confirmPassword')?.value;
  return np && cp && np !== cp ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-profile-page',
  standalone: false,
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css'],
})
export class ProfilePageComponent implements OnInit, OnDestroy {

  // ── State ─────────────────────────────────────────────────────────────────
  activeTab: 'profile' | 'password' = 'profile';
  currentUser: User | null = null;
  private userSub!: Subscription;

  // ── Profile form ──────────────────────────────────────────────────────────
  profileForm: FormGroup;
  profileLoading = false;
  profileSuccess = '';
  profileError = '';

  // ── Password form ─────────────────────────────────────────────────────────
  passwordForm: FormGroup;
  passwordLoading = false;
  passwordSuccess = '';
  passwordError = '';
  showCurrentPwd = false;
  showNewPwd = false;
  showConfirmPwd = false;

  // Config for a reusable Toast notification
  private Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router,
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/[A-Z]/),
        Validators.pattern(/[0-9]/),
      ]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    // Subscribe to auth state — pre-fill form when user loads
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get pName() { return this.profileForm.get('name')!; }
  get pEmail() { return this.profileForm.get('email')!; }
  get currentPassword() { return this.passwordForm.get('currentPassword')!; }
  get newPassword() { return this.passwordForm.get('newPassword')!; }
  get confirmPassword() { return this.passwordForm.get('confirmPassword')!; }

  get userInitials(): string {
    if (!this.currentUser?.name) return '?';
    return this.currentUser.name
      .split(' ')
      .map(w => w.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  get passwordStrength(): { label: string; level: number; color: string } {
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
    return { label: 'Strong', level: 4, color: '#16a34a' };
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileLoading = true;

    this.authService.updateProfile(
      this.pName.value.trim(),
      this.pEmail.value.trim(),
    ).subscribe({
      next: () => {
        this.profileLoading = false;
        // Success Toast
        this.Toast.fire({
          icon: 'success',
          title: 'Profile updated successfully'
        });
      },
      error: err => {
        this.profileLoading = false;
        // Error Modal
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: err.error?.error || 'Please try again.',
          confirmButtonColor: '#06b6d4'
        });
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordLoading = true;

    this.authService.changePassword(
      this.currentPassword.value,
      this.newPassword.value,
    ).subscribe({
      next: () => {
        this.passwordLoading = false;

        // Detailed Success Modal
        Swal.fire({
          title: 'Password Changed!',
          text: 'For security, you will be redirected to login.',
          icon: 'success',
          allowOutsideClick: false,
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true
        }).then(() => {
          this.authService.setUser(null);
          this.router.navigate(['/auth/login']);
        });

        this.passwordForm.reset();
      },
      error: err => {
        this.passwordLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Change Failed',
          text: err.error?.error || 'Check your current password and try again.',
          confirmButtonColor: '#06b6d4'
        });
      }
    });
  }

  switchTab(tab: 'profile' | 'password'): void {
    this.activeTab = tab;
    // Clear messages when switching tabs
    this.profileSuccess = '';
    this.profileError = '';
    this.passwordSuccess = '';
    this.passwordError = '';
  }
}