import { Component, Input } from '@angular/core';

export type MetricCardTone = 'default' | 'success' | 'danger' | 'ranking';

@Component({
  selector: 'app-metric-card',
  templateUrl: './metric-card.html',
  styleUrl: './metric-card.css',
  host: {
    '[class]': '"metric-card metric-card--" + tone',
  },
})
export class MetricCard {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() hint?: string;
  @Input() tone: MetricCardTone = 'default';
}
