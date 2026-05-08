import { AsyncPipe } from '@angular/common';
import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import { MapSummaryDto } from '../../../core/api/dto/maps.dto';
import { SeasonMapsDto } from '../../../core/api/dto/season-maps.dto';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { seasonCoverImage } from '../season-ui';

type MapSort = 'matches' | 'rounds' | 'lastPlayed';

type SeasonMapsVm =
  | ({ state: 'ready'; isCurrent: boolean; maps: MapSummaryDto[] } & SeasonMapsDto)
  | { state: 'loading' }
  | { state: 'error' };

@Component({
  selector: 'app-season-maps-page',
  imports: [AsyncPipe, EmptyState, RouterLink],
  templateUrl: './season-maps-page.html',
  styleUrl: './season-maps-page.css',
  encapsulation: ViewEncapsulation.None,
})
export class SeasonMapsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly searchTerm = signal('');
  protected readonly sortBy = signal<MapSort>('matches');
  protected readonly seasonCoverImage = seasonCoverImage;

  protected readonly vm$: Observable<SeasonMapsVm> = this.route.paramMap.pipe(
    map((params) => params.get('slug')?.trim() ?? ''),
    switchMap((slug) => this.loadSeasonMaps(slug)),
    startWith({ state: 'loading' } satisfies SeasonMapsVm),
    catchError(() => of({ state: 'error' } satisfies SeasonMapsVm)),
  );

  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateSort(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortBy.set(select.value as MapSort);
  }

  protected visibleMaps(maps: MapSummaryDto[]): MapSummaryDto[] {
    const term = this.searchTerm().trim().toLowerCase();
    const filtered = term
      ? maps.filter((mapSummary) => mapSummary.map.toLowerCase().includes(term))
      : [...maps];

    return filtered.sort((current, next) => {
      if (this.sortBy() === 'rounds') {
        return next.rounds - current.rounds;
      }

      if (this.sortBy() === 'lastPlayed') {
        return this.mapTimestamp(next) - this.mapTimestamp(current);
      }

      return next.matches - current.matches;
    });
  }

  protected formatDate(value?: string | null, includeTime = true): string {
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
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
    }).format(date);
  }

  protected formatNumber(value?: number | null, digits = 1): string {
    return typeof value === 'number' ? value.toFixed(digits) : '-';
  }

  protected tabLink(
    isCurrent: boolean,
    slug: string | undefined,
    target: 'overview' | 'ranking' | 'matches' | 'maps',
  ): string {
    const base = isCurrent || !slug ? '/seasons/current' : `/seasons/${slug}`;

    return target === 'overview' ? base : `${base}/${target}`;
  }

  private loadSeasonMaps(slug: string): Observable<SeasonMapsVm> {
    if (slug) {
      return this.cs2Api.getSeasonMaps(slug).pipe(
        map((payload): SeasonMapsVm => ({
          ...payload,
          maps: payload.maps ?? [],
          state: 'ready',
          isCurrent: false,
        })),
      );
    }

    return this.cs2Api.getSeasons().pipe(
      switchMap((index) => {
        const activeSeasonSlug = index.activeSeasonSlug?.trim();

        if (!activeSeasonSlug) {
          return of({ state: 'error' } satisfies SeasonMapsVm);
        }

        return this.cs2Api.getSeasonMaps(activeSeasonSlug).pipe(
          map((payload): SeasonMapsVm => ({
            ...payload,
            maps: payload.maps ?? [],
            state: 'ready',
            isCurrent: true,
          })),
        );
      }),
    );
  }

  private mapTimestamp(mapSummary: MapSummaryDto): number {
    const timestamp = new Date(mapSummary.lastPlayed).getTime();

    if (Number.isNaN(timestamp)) {
      return 0;
    }

    return timestamp;
  }
}
