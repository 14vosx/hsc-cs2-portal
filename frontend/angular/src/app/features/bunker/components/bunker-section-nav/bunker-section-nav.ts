import { ChangeDetectionStrategy, Component, ElementRef, input, output, viewChildren } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import type { AnalyticsTab } from '../../bunker-analytics.types';

interface AnalyticsTabOption {
  readonly id: AnalyticsTab;
  readonly labelKey: string;
}

@Component({
  selector: 'app-bunker-section-nav',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './bunker-section-nav.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './bunker-section-nav.css',
})
export class BunkerSectionNav {
  readonly activeTab = input.required<AnalyticsTab>();
  readonly tabChange = output<AnalyticsTab>();
  readonly tabs: readonly AnalyticsTabOption[] = [
    { id: 'overview', labelKey: 'bunker.navigation.overview' },
    { id: 'combat', labelKey: 'bunker.navigation.combat' },
    { id: 'maps', labelKey: 'bunker.navigation.maps' },
    { id: 'matches', labelKey: 'bunker.navigation.matches' },
  ];
  private readonly tabButtons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');

  selectTab(tab: AnalyticsTab): void {
    this.tabChange.emit(tab);
  }

  handleKeydown(event: KeyboardEvent, index: number): void {
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') nextIndex = (index + 1) % this.tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + this.tabs.length) % this.tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = this.tabs.length - 1;

    if (nextIndex === null) return;

    event.preventDefault();
    this.selectTab(this.tabs[nextIndex].id);
    this.tabButtons()[nextIndex]?.nativeElement.focus();
  }
}
