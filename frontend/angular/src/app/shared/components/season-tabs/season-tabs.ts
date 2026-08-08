import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

export type SeasonTab = 'overview' | 'ranking' | 'matches' | 'maps';

interface SeasonTabItem {
  id: SeasonTab;
  label: string;
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
  imports: [RouterLink],
  templateUrl: './season-tabs.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './season-tabs.css',
})
export class SeasonTabs {
  @Input({ required: true }) seasonSlug?: string;
  @Input({ required: true }) activeTab!: SeasonTab;

  protected readonly tabs: readonly SeasonTabItem[] = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'ranking', label: 'Ranking' },
    { id: 'matches', label: 'Partidas' },
    { id: 'maps', label: 'Mapas' },
  ];

  protected tabLink(tab: SeasonTab): string {
    return seasonTabLink(this.seasonSlug, tab);
  }

}
