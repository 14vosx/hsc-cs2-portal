import { AsyncPipe } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { UiCard } from '../../shared/components/card/card';
import { MetricCard } from '../../shared/components/metric-card/metric-card';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PageState } from '../../shared/components/page-state/page-state';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { MatchesApiService } from './data-access/matches-api.service';
import type { MatchSummary } from './domain/match.model';
import { MatchScoreCard } from './match-score-card/match-score-card';

interface MatchesReadyVm {
  state: 'ready';
  generatedAt: string;
  matches: readonly MatchSummary[];
  mapOptions: readonly string[];
  latestMatch?: MatchSummary;
  totalMapsPlayed: number;
}

type MatchesVm =
  | MatchesReadyVm
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'empty' };

@Component({
  selector: 'app-matches-page',
  imports: [
    AsyncPipe,
    MetricCard,
    PageHeader,
    PageState,
    SectionHeader,
    StatusBadge,
    UiCard,
    MatchScoreCard,
  ],
  templateUrl: './matches-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './matches-page.css',
})
export class MatchesPage {
  private readonly matchesApi = inject(MatchesApiService);
  private readonly reload$ = new Subject<void>();

  protected readonly searchTerm = signal('');
  protected readonly selectedMap = signal('');

  protected readonly vm$: Observable<MatchesVm> = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.matchesApi.getMatches().pipe(
        map((index): MatchesVm => {
          if (index.matches.length === 0) {
            return { state: 'empty' };
          }

          const mapOptions = Array.from(
            new Set(
              index.matches
                .flatMap((m) => m.maps.map((map) => map.name))
                .filter((name): name is string => typeof name === 'string' && name.trim() !== '')
            )
          ).sort((a, b) => a.localeCompare(b));

          return {
            state: 'ready',
            generatedAt: index.generatedAt,
            matches: index.matches,
            mapOptions,
            latestMatch: index.matches[0],
            totalMapsPlayed: index.matches.reduce(
              (total, match) => total + match.maps.length,
              0
            ),
          };
        }),
        startWith({ state: 'loading' } satisfies MatchesVm),
        catchError(() => of({ state: 'error' } satisfies MatchesVm))
      )
    )
  );

  protected retry(): void {
    this.reload$.next();
  }

  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateMapFilter(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedMap.set(select.value);
  }

  protected filteredMatches(matches: readonly MatchSummary[]): readonly MatchSummary[] {
    const term = this.searchTerm().trim().toLowerCase();
    const mapFilter = this.selectedMap();

    return matches.filter((match) => {
      const matchesMap =
        !mapFilter ||
        match.maps.some((map) => (map.name ?? '').toLowerCase() === mapFilter.toLowerCase());

      if (!matchesMap) {
        return false;
      }

      if (!term) {
        return true;
      }

      const searchable = [
        String(match.id),
        match.team1.name ?? '',
        match.team2.name ?? '',
        match.winner ?? '',
        match.seriesType ?? '',
        ...match.maps.map((map) => map.name ?? ''),
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(term);
    });
  }

  protected formatDate(value?: string | null): string {
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
}
