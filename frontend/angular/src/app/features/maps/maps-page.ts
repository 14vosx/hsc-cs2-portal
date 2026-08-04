import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { UiCard } from '../../shared/components/card/card';
import { MetricCard } from '../../shared/components/metric-card/metric-card';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PageState } from '../../shared/components/page-state/page-state';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { MapsApiService } from './data-access/maps-api.service';
import type { MapSummary } from './domain/map.model';
import { MapStatCard } from './map-stat-card/map-stat-card';

export type MapSort = 'published' | 'matches' | 'rounds' | 'lastPlayed' | 'name';

interface MapsReadyVm {
  state: 'ready';
  generatedAt: string;
  maps: readonly MapSummary[];
  mostPlayedMap?: MapSummary;
  totalMapAppearances: number;
  totalRounds: number;
}

type MapsVm = MapsReadyVm | { state: 'loading' } | { state: 'error' } | { state: 'empty' };

@Component({
  selector: 'app-maps-page',
  imports: [
    AsyncPipe,
    MetricCard,
    PageHeader,
    PageState,
    SectionHeader,
    StatusBadge,
    UiCard,
    MapStatCard,
  ],
  templateUrl: './maps-page.html',
  styleUrl: './maps-page.css',
})
export class MapsPage {
  private readonly mapsApi = inject(MapsApiService);
  private readonly reload$ = new Subject<void>();

  protected readonly searchTerm = signal('');
  protected readonly sortBy = signal<MapSort>('published');

  protected readonly vm$: Observable<MapsVm> = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.mapsApi.getMaps().pipe(
        map((index): MapsVm => {
          if (index.maps.length === 0) {
            return { state: 'empty' };
          }

          return {
            state: 'ready',
            generatedAt: index.generatedAt,
            maps: index.maps,
            mostPlayedMap: index.maps[0],
            totalMapAppearances: index.maps.reduce((acc, curr) => acc + curr.matches, 0),
            totalRounds: index.maps.reduce((acc, curr) => acc + curr.rounds, 0),
          };
        }),
        startWith({ state: 'loading' } satisfies MapsVm),
        catchError(() => of({ state: 'error' } satisfies MapsVm))
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

  protected updateSort(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortBy.set(select.value as MapSort);
  }

  protected visibleMaps(maps: readonly MapSummary[]): readonly MapSummary[] {
    const term = this.searchTerm().trim().toLowerCase();
    const filtered = term
      ? maps.filter((m) => m.name.toLowerCase().includes(term))
      : [...maps];

    const sort = this.sortBy();
    if (sort === 'published') {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      if (sort === 'matches') {
        if (b.matches !== a.matches) {
          return b.matches - a.matches;
        }
      } else if (sort === 'rounds') {
        if (b.rounds !== a.rounds) {
          return b.rounds - a.rounds;
        }
      } else if (sort === 'lastPlayed') {
        const timeA = new Date(a.lastPlayedAt).getTime();
        const timeB = new Date(b.lastPlayedAt).getTime();
        const validA = !Number.isNaN(timeA);
        const validB = !Number.isNaN(timeB);

        if (validA && validB && timeA !== timeB) {
          return timeB - timeA;
        }
        if (validA && !validB) {
          return -1;
        }
        if (!validA && validB) {
          return 1;
        }
      } else if (sort === 'name') {
        const cmp = a.name.localeCompare(b.name, 'pt-BR');
        if (cmp !== 0) {
          return cmp;
        }
      }

      return maps.indexOf(a) - maps.indexOf(b);
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