import { Pipe, PipeTransform } from '@angular/core';
import { Customer, User } from '../Interface';

@Pipe({
  name: 'filterActive',
  standalone: false,
  pure: true // Pipe only re-runs if the array reference changes
})
export class FilterActivePipe implements PipeTransform {
  transform(customers: Customer[]): number {
    if (!customers) return 0;
    return customers.filter(c => !c.isLocked).length;
  }
}