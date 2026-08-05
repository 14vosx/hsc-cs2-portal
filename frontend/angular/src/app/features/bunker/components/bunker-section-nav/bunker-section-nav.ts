import { Component, computed, input } from '@angular/core';
import type { BunkerSummary } from '../../domain/bunker.model';

@Component({
  selector: 'app-bunker-section-nav',
  standalone: true,
  templateUrl: './bunker-section-nav.html',
  styleUrl: './bunker-section-nav.css',
})
export class BunkerSectionNav {
  readonly summary = input.required<BunkerSummary>();

  readonly hasMaps = computed(() => (this.summary().seasonPlayer?.byMap?.length ?? 0) > 0);
  readonly hasRecentMaps = computed(() => (this.summary().seasonPlayer?.recentMaps?.length ?? 0) > 0);
  readonly hasTimeline = computed(() => (this.summary().seasonPlayer?.timeline?.length ?? 0) > 0);
  readonly hasLifetime = computed(() => this.summary().competitiveProfile?.lifetime != null);
}
