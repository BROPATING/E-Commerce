import { Component, inject, OnInit } from '@angular/core';
import { Customer } from '../../../shared/Interface';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-customer',
  standalone: false,
  templateUrl: './admin-customer.component.html',
  styleUrl: './admin-customer.component.css'
})
export class AdminCustomersComponent implements OnInit {
  customers: Customer[] = [];
  loading = true;

  private adminService = inject(AdminService); 

  ngOnInit(): void { this.loadCustomers(); }

  loadCustomers(): void {
    this.loading = true;
    this.adminService.getAllCustomers().subscribe({
      next: res => {
        // this.customers = res.customers ?? [];  // ← fallback if API returns null
        this.customers = Array.isArray(res) ? res : (res.customers ?? []);
        this.loading = false;
      },
      error: () => {
        this.customers = [];   // ← error path must also set array, not leave undefined
        this.loading = false;
      }
    });
  }

  toggleLock(customer: Customer): void {
    const action = customer.isLocked ? 'unlock' : 'lock';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${customer.name}?`)) return;

    this.adminService.toggleLock(customer.id).subscribe({
      next: res => {
        customer.isLocked = res.isLocked;
      },
      error: err => alert(err.error?.error || 'Action failed'),
    });
  }
}
