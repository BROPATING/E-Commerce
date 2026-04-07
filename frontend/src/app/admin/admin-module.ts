import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing-module';
import { NgModule } from '@angular/core';

/**
 * AdminModule is lazy loaded — its code is only downloaded
 * when a user navigates to /admin for the first time.
 * The AdminGuard prevents non-admins from triggering this load.
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    AdminRoutingModule,
  ],
})
export class AdminModule {}