import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // ✅ Import this
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: false,
  template: `
    <app-navbar></app-navbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.initSession().subscribe({
      error: () => {}
    });
  }
}