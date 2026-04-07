import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // ✅ Import this
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true, // ✅ Add this line
  imports: [RouterOutlet], // ✅ Import RouterOutlet, NOT the AdminRoutingModule
  templateUrl: "app.html",
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.initSession().subscribe({
      error: () => {}
    });
  }
}