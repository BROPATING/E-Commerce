import { Component, inject, OnInit } from '@angular/core';
import { Customer, User } from '../../../shared/Interface';
import { AdminService } from '../../../core/services/admin.service';

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
  toggleLock(customer: Customer): void {
    const action = customer.isLocked ? 'unlock' : 'lock';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${customer.name}?`)) return;

    this.adminService.toggleLock(customer.id).subscribe({
      next: res => {
        customer.isLocked = res.isLocked;
        // Force change detection by reassigning array
        this.customers = [...this.customers];
      },
      error: err => alert(err.error?.error || 'Action failed'),
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