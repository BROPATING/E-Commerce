import { Pipe, PipeTransform } from "@angular/core";
import { Customer, User } from "../Interface";

@Pipe({
  name: 'filterLocked',
  standalone: false,
  pure: true // Re-calculates when the array reference changes
})
export class FilterLockedPipe implements PipeTransform {
  transform(customers: Customer[]): number {
    if (!customers) return 0;
    return customers.filter(c => c.isLocked).length;
  }
}