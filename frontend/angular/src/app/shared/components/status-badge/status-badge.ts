import { Component, computed, input } from '@angular/core';

export type StatusBadgeVariant =
  | 'active'
  | 'closed'
  | 'neutral'
  | 'warning'
  | 'info'
  | 'success'
  | 'danger';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
  host: {
    '[class]': 'hostClass()',
  },
})
export class StatusBadge {
  readonly label = input.required<string>();
  readonly status = input<StatusBadgeVariant>();
  readonly tone = input<StatusBadgeVariant>();

  readonly effectiveVariant = computed(() => this.tone() || this.status() || 'neutral');
  readonly hostClass = computed(() => `status-badge status-badge--${this.effectiveVariant()}`);
}
