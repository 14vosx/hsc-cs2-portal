import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

import type { MapRecentMatch } from '../domain/map.model';

@Component({
  selector: 'app-map-recent-match-table',
  imports: [RouterLink],
  templateUrl: './map-recent-match-table.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './map-recent-match-table.css',
})
export class MapRecentMatchTable {
  readonly recentMatches = input.required<readonly MapRecentMatch[]>();

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

  protected seriesTypeLabel(seriesType?: string | null): string {
    return seriesType || 'Série não informada';
  }

  protected team1Name(match: MapRecentMatch): string {
    return match.team1.name || 'Time não informado';
  }

  protected team2Name(match: MapRecentMatch): string {
    return match.team2.name || 'Time não informado';
  }

  protected seriesScoreLabel(match: MapRecentMatch): string {
    const t1 = match.team1.score;
    const t2 = match.team2.score;
    if (typeof t1 === 'number' && typeof t2 === 'number') {
      return `${t1} x ${t2}`;
    }
    return '— x —';
  }

  protected mapNumberLabel(mapNumber?: number | null): string {
    if (typeof mapNumber === 'number' && Number.isInteger(mapNumber)) {
      return `#${mapNumber}`;
    }
    return '—';
  }

  protected mapScoreLabel(match: MapRecentMatch): string {
    const t1 = match.mapScore.team1;
    const t2 = match.mapScore.team2;
    if (typeof t1 === 'number' && typeof t2 === 'number') {
      return `${t1} x ${t2}`;
    }
    return '— x —';
  }

  protected winnerLabel(winner?: string | null): string {
    return winner || 'Sem vencedor';
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
