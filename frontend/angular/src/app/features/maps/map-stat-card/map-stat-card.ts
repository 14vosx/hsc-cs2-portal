import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { MapSummary } from '../domain/map.model';

@Component({
  selector: 'app-map-stat-card',
  imports: [RouterLink],
  templateUrl: './map-stat-card.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './map-stat-card.css',
})
export class MapStatCard {
  readonly map = input.required<MapSummary>();
  readonly highlight = input<boolean>(false);

  private readonly knownMapImages = new Set([
    'de_ancient',
    'de_anubis',
    'de_dust2',
    'de_inferno',
    'de_mirage',
    'de_nuke',
    'de_overpass',
    'de_train',
  ]);

  protected mapBackgroundImage(): string {
    const name = this.map().name;
    if (!name || !this.knownMapImages.has(name)) {
      return 'none';
    }
    return `url("map-images/${name}.png")`;
  }

  protected formatDate(value?: string | null): string {
    if (!value) {
      return 'Sem data';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected formatAvg(val: number): string {
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      return '0.0';
    }
    return val.toFixed(1);
  }
}
