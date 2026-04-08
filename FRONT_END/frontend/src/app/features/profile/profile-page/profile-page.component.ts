import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService} from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { User } from '../../../shared/Interface';

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
  profileError   = '';

  // ── Password form ─────────────────────────────────────────────────────────
  passwordForm: FormGroup;
  passwordLoading = false;
  passwordSuccess = '';
  passwordError   = '';
  showCurrentPwd  = false;
  showNewPwd      = false;
  showConfirmPwd  = false;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private router: Router,
  ) {
    this.profileForm = this.fb.group({
      name:  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword:     ['', [
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
          name:  user.name,
          email: user.email,
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get pName()           { return this.profileForm.get('name')!; }
  get pEmail()          { return this.profileForm.get('email')!; }
  get currentPassword() { return this.passwordForm.get('currentPassword')!; }
  get newPassword()     { return this.passwordForm.get('newPassword')!; }
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
    if (pwd.length >= 8)   score++;
    if (pwd.length >= 12)  score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { label: 'Weak',   level: 1, color: '#ef4444' };
    if (score <= 2) return { label: 'Fair',   level: 2, color: '#f59e0b' };
    if (score <= 3) return { label: 'Good',   level: 3, color: '#3b82f6' };
    return            { label: 'Strong', level: 4, color: '#16a34a' };
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileLoading = true;
    this.profileSuccess = '';
    this.profileError   = '';

    this.authService.updateProfile(
      this.pName.value.trim(),
      this.pEmail.value.trim(),
    ).subscribe({
      next: () => {
        this.profileLoading = false;
        this.profileSuccess = 'Profile updated successfully.';
        setTimeout(() => { this.profileSuccess = ''; }, 4000);
      },
      error: err => {
        this.profileLoading = false;
        this.profileError = err.error?.error || 'Update failed. Please try again.';
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.passwordLoading = true;
    this.passwordSuccess = '';
    this.passwordError   = '';

    this.authService.changePassword(
      this.currentPassword.value,
      this.newPassword.value,
    ).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordSuccess = 'Password changed successfully. Redirecting to login...';
        this.passwordForm.reset();

        // Backend invalidates session — log out after 2s
        setTimeout(() => {
          this.authService.setUser(null);
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: err => {
        this.passwordLoading = false;
        this.passwordError = err.error?.error || 'Password change failed. Please try again.';
      }
    });
  }

  switchTab(tab: 'profile' | 'password'): void {
    this.activeTab = tab;
    // Clear messages when switching tabs
    this.profileSuccess = '';
    this.profileError   = '';
    this.passwordSuccess = '';
    this.passwordError   = '';
  }
}