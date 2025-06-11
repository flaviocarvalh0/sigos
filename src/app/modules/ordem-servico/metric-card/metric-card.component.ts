// metric-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [CommonModule],
  template: `
 <div class="card h-100 shadow-sm border-0">
      <div class="card-body d-flex justify-content-between align-items-center p-3">
        <div>
          <h6 class="card-title text-muted fw-normal mb-1 text-truncate">{{ title }}</h6>
          <p class="h4 fw-bold mb-0">{{ value }}</p>
          <p *ngIf="change" [class]="'small mt-1 mb-0 ' + getChangeColorClass()">
            {{ change }}
          </p>
        </div>
        <!-- AJUSTE APLICADO AQUI -->
        <div [class]="'p-3 rounded-3 d-flex align-items-center justify-content-center ' + color">
          <ng-content select="[icon]"></ng-content>
        </div>
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
