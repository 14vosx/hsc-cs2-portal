import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith } from 'rxjs';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import { MatchMapDto, MatchSummaryDto } from '../../core/api/dto/matches.dto';
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

  protected primaryMap(match: MatchSummaryDto): MatchMapDto | undefined {
    return match.maps[0];
  }

  protected formatPrimaryScore(match: MatchSummaryDto): string {
    const map = this.primaryMap(match);

    if (map) {
      return `${map.team1_score} x ${map.team2_score}`;
    }

    return this.formatScore(match);
  }

  protected primaryMapName(match: MatchSummaryDto): string {
    return this.primaryMap(match)?.mapname || 'Mapa não informado';
  }

  protected mapBackgroundImage(match: MatchSummaryDto): string {
    const mapName = this.primaryMap(match)?.mapname;

    if (!mapName || !this.knownMapImages.has(mapName)) {
      return 'none';
    }

    return `url("maps/${mapName}.png")`;
  }

  protected formatSeriesScore(match: MatchSummaryDto): string {
    return `${match.team1_score} x ${match.team2_score}`;
  }

  protected matchEndedAt(match: MatchSummaryDto): string {
    return match.end_time || match.start_time;
  }

  protected winnerLabel(match: MatchSummaryDto): string {
    return match.winner || 'Sem vencedor';
  }

  protected winnerSide(match: MatchSummaryDto): 'team1' | 'team2' | 'unknown' {
    if (match.winner === match.team1_name) {
      return 'team1';
    }

    if (match.winner === match.team2_name) {
      return 'team2';
    }

    return 'unknown';
  }

  protected isSeriesMatch(match: MatchSummaryDto): boolean {
    return match.maps.length > 1 || match.series_type !== 'BO1';
  }

  private matchTimestamp(match: MatchSummaryDto): number {
    const timestamp = new Date(match.end_time || match.start_time).getTime();

    if (Number.isNaN(timestamp)) {
      return match.matchid;
    }

    return timestamp;
  }
}
