// metric-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card h-100 min-h-100 transition-all duration-200 hover:shadow-md">
      <div class="card-header d-flex flex-row justify-content-between align-items-center pb-2">
        <h5 class="text-sm font-medium text-muted mb-0 text-truncate">{{ title }}</h5>
        <div [class]="'p-2 rounded-lg ' + color">
          <ng-content select="[icon]"></ng-content>
        </div>
      </div>
      <div class="card-body">
        <div class="text-2xl font-bold">{{ value }}</div>
        <p *ngIf="change" [class]="'text-xs mt-1 ' + getChangeColorClass()">
          {{ change }}
        </p>
      </div>
    </div>
  `
})
export class MetricCardComponent {
  @Input() title: string = '';
  @Input() value: string = '';
  @Input() change?: string;
  @Input() changeType: 'positive' | 'negative' | 'neutral' = 'neutral';
  @Input() color: string = 'bg-primary';

  getChangeColorClass(): string {
    return {
      positive: 'text-success',
      negative: 'text-danger',
      neutral: 'text-muted'
    }[this.changeType];
  }
}