import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

export type SeasonTab = 'overview' | 'ranking' | 'matches' | 'maps';

interface SeasonTabItem {
  id: SeasonTab;
  labelKey: string;
}

export function seasonTabLink(
  seasonSlug: string | undefined,
  tab: SeasonTab,
): string {
  const slug = seasonSlug?.trim();

  if (!slug) {
    return '/seasons';
  }

  const base = `/seasons/${slug}`;

  return tab === 'overview' ? base : `${base}/${tab}`;
}

@Component({
  selector: 'app-season-tabs',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './season-tabs.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './season-tabs.css',
})
export class SeasonTabs {
  @Input({ required: true }) seasonSlug?: string;
  @Input({ required: true }) activeTab!: SeasonTab;

  protected readonly tabs: readonly SeasonTabItem[] = [
    { id: 'overview', labelKey: 'seasons.tabs.overview' },
    { id: 'ranking', labelKey: 'seasons.tabs.ranking' },
    { id: 'matches', labelKey: 'seasons.tabs.matches' },
    { id: 'maps', labelKey: 'seasons.tabs.maps' },
  ];

  protected tabLink(tab: SeasonTab): string {
    return seasonTabLink(this.seasonSlug, tab);
  }

}
