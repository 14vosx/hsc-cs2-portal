import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { LocaleService } from '../../../core/i18n/locale.service';
import type { MapRecentMatch } from '../domain/map.model';

@Component({
  selector: 'app-map-recent-match-table',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './map-recent-match-table.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './map-recent-match-table.css',
})
export class MapRecentMatchTable {
  private readonly localeService = inject(LocaleService);
  readonly recentMatches = input.required<readonly MapRecentMatch[]>();

  protected formatDate(value?: string | null): string | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  protected seriesTypeLabel(seriesType?: string | null): string | null {
    return seriesType || null;
  }

  protected team1Name(match: MapRecentMatch): string | null {
    return match.team1.name || null;
  }

  protected team2Name(match: MapRecentMatch): string | null {
    return match.team2.name || null;
  }

  protected seriesScoreLabel(match: MapRecentMatch): string {
    const t1 = match.team1.score;
    const t2 = match.team2.score;
    if (typeof t1 === 'number' && typeof t2 === 'number') {
      return `${t1} – ${t2}`;
    }
    return '— – —';
  }

  protected mapScoreLabel(match: MapRecentMatch): string {
    const t1 = match.mapScore.team1;
    const t2 = match.mapScore.team2;
    if (typeof t1 === 'number' && typeof t2 === 'number') {
      return `${t1} – ${t2}`;
    }
    return '— – —';
  }

  protected scoreLabel(value?: number | null): string {
    return typeof value === 'number' && Number.isFinite(value) ? String(value) : '—';
  }

  protected winnerLabel(winner?: string | null): string | null {
    return winner || null;
  }

  protected isTeam1Winner(match: MapRecentMatch): boolean {
    const w = match.winner;
    const name = match.team1.name;
    return Boolean(w && name && w === name);
  }

  protected isTeam2Winner(match: MapRecentMatch): boolean {
    const w = match.winner;
    const name = match.team2.name;
    return Boolean(w && name && w === name);
  }
}
