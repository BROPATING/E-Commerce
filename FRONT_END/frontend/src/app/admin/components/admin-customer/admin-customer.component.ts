import { Component, inject, OnInit } from '@angular/core';
import { Customer, User } from '../../../shared/Interface';
import { AdminService } from '../../../core/services/admin.service';
import Swal from 'sweetalert2';

/**
 * AdminCustomersComponent
 * -----------------------
 * Provides customer management functionality for administrators:
 * - Displays all customers
 * - Handles loading and error states
 * - Allows locking/unlocking customer accounts
 * - Shows counts of active vs locked customers
 */
@Component({
  selector: 'app-admin-customer',
  standalone: false,
  templateUrl: './admin-customer.component.html',
  styleUrl: './admin-customer.component.css'
})
export class AdminCustomersComponent implements OnInit {
  /** List of customers loaded from backend */
  customers: Customer[] = [];

  /** Loading flag for initial data fetch */
  loading = true;

  /** Injected admin service */
  private adminService = inject(AdminService);

  /**
   * Lifecycle hook: OnInit
   * - Loads customers on component initialization
   */
  ngOnInit(): void {
    this.loadCustomers();
  }

  /**
   * Fetch all customers from backend
   * - Updates customers list
   * - Handles loading state and error path
   */
  loadCustomers(): void {
    this.loading = true;
    this.adminService.getAllCustomers().subscribe({
      next: res => {
        // Some APIs may return { customers }, others may return array directly
        this.customers = Array.isArray(res) ? res : (res.customers ?? []);
        this.loading = false;
      },
      error: () => {
        // Ensure customers is always an array, even on error
        this.customers = [];
        this.loading = false;
      }
    });
  }

  /**
   * Toggle lock/unlock state of a customer account
   * - Confirms action with user
   * - Calls AdminService.toggleLock
   * - Updates customer state on success
   * @param customer customer object
   */
  // 
  toggleLock(customer: Customer): void {
    const action = customer.isLocked ? 'unlock' : 'lock';
    const actionColor = customer.isLocked ? '#10b981' : '#ef4444'; // Green for unlock, Red for lock

    // 2. Replace window.confirm with Swal.fire
    Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} user?`,
      text: `Are you sure you want to ${action} ${customer.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: actionColor,
      cancelButtonColor: '#64748b',
      confirmButtonText: `Yes, ${action} it!`,
      reverseButtons: true // Puts "Cancel" on the left
    }).then((result) => {
      if (result.isConfirmed) {
        // Proceed with API call
        this.adminService.toggleLock(customer.id).subscribe({
          next: res => {
            customer.isLocked = res.isLocked;
            this.customers = [...this.customers];

            // 3. Success Toast
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: `User ${customer.isLocked ? 'locked' : 'unlocked'} successfully`,
              showConfirmButton: false,
              timer: 3000,
              timerProgressBar: true
            });
          },
          error: err => {
            // 4. Error Alert
            Swal.fire('Failed', err.error?.error || 'Action failed', 'error');
          }
        });
      }
    });
  }

  /**
   * Count of active (unlocked) customers
   */
  get activeCount(): number {
    return this.customers.filter(c => !c.isLocked).length;
  }

  /**
   * Count of locked customers
   */
  get lockedCount(): number {
    return this.customers.filter(c => c.isLocked).length;
  }
}