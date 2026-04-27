import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith } from 'rxjs';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import { MatchSummaryDto } from '../../core/api/dto/matches.dto';
import { DataCard } from '../../shared/components/data-card/data-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { MetricCard } from '../../shared/components/metric-card/metric-card';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

interface MatchesReadyVm {
  state: 'ready';
  generatedAt: string;
  matches: MatchSummaryDto[];
  mapOptions: string[];
  latestMatch?: MatchSummaryDto;
  totalMapsPlayed: number;
}

type MatchesVm = MatchesReadyVm | { state: 'loading' } | { state: 'error' };

@Component({
  selector: 'app-matches-page',
  imports: [AsyncPipe, RouterLink, DataCard, EmptyState, MetricCard, SectionHeader, StatusBadge],
  templateUrl: './matches-page.html',
  styleUrl: './matches-page.css',
})
export class MatchesPage {
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly searchTerm = signal('');
  protected readonly selectedMap = signal('');

  protected readonly vm$: Observable<MatchesVm> = this.cs2Api.getMatches().pipe(
    map((payload): MatchesVm => {
      const matches = [...(payload.matches ?? [])].sort((current, next) => {
        const nextTime = this.matchTimestamp(next);
        const currentTime = this.matchTimestamp(current);

        if (nextTime !== currentTime) {
          return nextTime - currentTime;
        }

        return next.matchid - current.matchid;
      });

      const mapOptions = Array.from(
        new Set(matches.flatMap((match) => match.maps.map((map) => map.mapname)).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b));

      return {
        state: 'ready',
        generatedAt: payload.generatedAt,
        matches,
        mapOptions,
        latestMatch: matches[0],
        totalMapsPlayed: matches.reduce((total, match) => total + match.maps.length, 0),
      };
    }),
    startWith({ state: 'loading' } satisfies MatchesVm),
    catchError(() => of({ state: 'error' } satisfies MatchesVm)),
  );

  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateMapFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedMap.set(select.value);
  }

  protected filteredMatches(matches: MatchSummaryDto[]): MatchSummaryDto[] {
    const term = this.searchTerm().trim().toLowerCase();
    const mapFilter = this.selectedMap();

    return matches.filter((match) => {
      const matchesMap =
        !mapFilter || match.maps.some((map) => map.mapname.toLowerCase() === mapFilter.toLowerCase());

      if (!matchesMap) {
        return false;
      }

      if (!term) {
        return true;
      }

      const searchable = [
        String(match.matchid),
        match.team1_name,
        match.team2_name,
        match.winner,
        match.series_type,
        ...match.maps.map((map) => map.mapname),
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(term);
    });
  }

  protected formatDate(value?: string): string {
    if (!value) {
      return 'Sem data disponível';
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

  protected formatScore(match: MatchSummaryDto): string {
    return `${match.team1_score} x ${match.team2_score}`;
  }

  protected winnerLabel(match: MatchSummaryDto): string {
    return match.winner || 'Sem vencedor';
  }

  protected isWinner(match: MatchSummaryDto, teamName: string): boolean {
    return match.winner === teamName;
  }

  private matchTimestamp(match: MatchSummaryDto): number {
    const timestamp = new Date(match.end_time || match.start_time).getTime();

    if (Number.isNaN(timestamp)) {
      return match.matchid;
    }

    return timestamp;
  }
}