import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { PageState } from '../../shared/components/page-state/page-state';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { MatchesApiService } from './data-access/matches-api.service';
import type { MatchMapSummary, MatchSummary } from './domain/match.model';

interface MatchesReadyVm {
  state: 'ready';
  generatedAt: string;
  matches: readonly MatchSummary[];
  mapOptions: readonly string[];
  latestMatch: MatchSummary;
  totalMapsPlayed: number;
}

type MatchesVm =
  | MatchesReadyVm
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'empty' };

@Component({
  selector: 'app-matches-page',
  imports: [AsyncPipe, PageState, RouterLink, StatusBadge, TranslatePipe],
  templateUrl: './matches-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './matches-page.css',
})
export class MatchesPage {
  private readonly matchesApi = inject(MatchesApiService);
  private readonly reload$ = new Subject<void>();
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

  protected readonly pageSize = 10;
  protected readonly searchTerm = signal('');
  protected readonly selectedMap = signal('');
  protected readonly currentPage = signal(1);

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
                .flatMap((match) => match.maps.map((mapItem) => mapItem.name))
                .filter(
                  (name): name is string => typeof name === 'string' && name.trim() !== ''
                )
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
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  protected updateMapFilter(event: Event): void {
    this.selectedMap.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  protected filteredMatches(matches: readonly MatchSummary[]): readonly MatchSummary[] {
    const term = this.searchTerm().trim().toLowerCase();
    const mapFilter = this.selectedMap().toLowerCase();

    return matches.filter((match) => {
      const matchesMap =
        !mapFilter ||
        match.maps.some((mapItem) => (mapItem.name ?? '').toLowerCase() === mapFilter);

      if (!matchesMap) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [
        String(match.id),
        match.team1.name ?? '',
        match.team2.name ?? '',
        match.winner ?? '',
        match.seriesType ?? '',
        ...match.maps.map((mapItem) => mapItem.name ?? ''),
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }

  protected paginatedMatches(matches: readonly MatchSummary[]): readonly MatchSummary[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return matches.slice(start, start + this.pageSize);
  }

  protected pageCount(totalMatches: number): number {
    return Math.ceil(totalMatches / this.pageSize);
  }

  protected pageNumbers(totalMatches: number): readonly number[] {
    return Array.from({ length: this.pageCount(totalMatches) }, (_, index) => index + 1);
  }

  protected goToPage(page: number, totalMatches: number): void {
    const target = Math.min(Math.max(page, 1), this.pageCount(totalMatches));
    this.currentPage.set(target);
  }

  protected rangeStart(totalMatches: number): number {
    return totalMatches === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1;
  }

  protected rangeEnd(totalMatches: number): number {
    return Math.min(this.currentPage() * this.pageSize, totalMatches);
  }

  protected primaryMap(match: MatchSummary): MatchMapSummary | undefined {
    return match.maps[0];
  }

  protected primaryMapName(match: MatchSummary): string | null {
    return this.primaryMap(match)?.name || null;
  }

  protected mapBackgroundImage(match: MatchSummary): string {
    const mapName = this.primaryMap(match)?.name;
    return mapName && this.knownMapImages.has(mapName)
      ? `url("map-images/${mapName}.png")`
      : 'none';
  }

  protected teamName(name: string | null): string | null {
    return name || null;
  }

  protected scoreLabel(score: number | null): number | string {
    return score ?? '—';
  }

  protected winnerSide(match: MatchSummary): 'team1' | 'team2' | 'unknown' {
    if (match.winner && match.winner === match.team1.name) {
      return 'team1';
    }
    if (match.winner && match.winner === match.team2.name) {
      return 'team2';
    }
    return 'unknown';
  }

  protected durationLabel(match: MatchSummary): string | null {
    if (!match.startedAt || !match.endedAt) {
      return null;
    }

    const startedAt = new Date(match.startedAt).getTime();
    const endedAt = new Date(match.endedAt).getTime();
    if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt) || endedAt < startedAt) {
      return null;
    }

    const totalMinutes = Math.floor((endedAt - startedAt) / 60_000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${String(minutes).padStart(2, '0')}min` : `${minutes} min`;
  }

  protected formatDate(value?: string | null): string | null {
    if (!value) {
      return null;
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

  protected matchDate(match: MatchSummary): string | null {
    return this.formatDate(match.endedAt || match.startedAt);
  }
}
