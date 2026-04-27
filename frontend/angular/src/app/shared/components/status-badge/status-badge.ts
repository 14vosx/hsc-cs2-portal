import { Component, Input } from '@angular/core';

export type StatusBadgeTone = 'neutral' | 'success' | 'danger' | 'warning';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
  host: {
    '[class]': '"status-badge status-badge--" + tone',
  },
})
export class StatusBadge {
  @Input({ required: true }) label!: string;
  @Input() tone: StatusBadgeTone = 'neutral';
}
