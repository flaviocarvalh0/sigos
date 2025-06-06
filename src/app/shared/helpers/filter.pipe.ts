import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], search: string, field: string): any[] {
    if (!items || !search) return items;

    return items.filter(item =>
      item[field]?.toLowerCase().includes(search.toLowerCase())
    );
  }
}
