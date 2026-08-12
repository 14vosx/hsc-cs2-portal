import { AsyncPipe } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { PageState } from '../../shared/components/page-state/page-state';
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
  averageRounds: number | null;
}

type MapsVm = MapsReadyVm | { state: 'loading' } | { state: 'error' } | { state: 'empty' };
interface RelativeDateDescriptor { readonly key: string; readonly params: { readonly days?: number }; }

@Component({
  selector: 'app-maps-page',
  imports: [
    AsyncPipe,
    RouterLink,
    PageState,
    MapStatCard,
    TranslatePipe,
  ],
  templateUrl: './maps-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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

          const totalMapAppearances = index.maps.reduce((acc, curr) => acc + curr.matches, 0);
          const totalRounds = index.maps.reduce((acc, curr) => acc + curr.rounds, 0);
          const mostPlayedMap = index.maps.reduce((current, candidate) =>
            candidate.matches > current.matches ? candidate : current
          );

          return {
            state: 'ready',
            generatedAt: index.generatedAt,
            maps: index.maps,
            mostPlayedMap,
            totalMapAppearances,
            totalRounds,
            averageRounds: totalMapAppearances > 0 ? totalRounds / totalMapAppearances : null,
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

  protected formatNumber(value: number | null): string {
    return value === null || !Number.isFinite(value) ? '—' : value.toFixed(1).replace('.', ',');
  }

  protected rotationShare(matches: number, total: number): number {
    return total > 0 ? (matches / total) * 100 : 0;
  }

  protected formatPercent(value: number): string {
    return `${value.toFixed(1).replace('.', ',')}%`;
  }

  protected mapBackgroundImage(name: string): string {
    const knownMaps = new Set([
      'de_ancient', 'de_anubis', 'de_dust2', 'de_inferno',
      'de_mirage', 'de_nuke', 'de_overpass', 'de_train',
    ]);
    return knownMaps.has(name) ? `url("map-images/${name}.png")` : 'none';
  }

  protected relativeDate(value: string | null | undefined, generatedAt: string): RelativeDateDescriptor {
    const played = value ? new Date(value).getTime() : Number.NaN;
    const snapshot = new Date(generatedAt).getTime();
    if (Number.isNaN(played) || Number.isNaN(snapshot)) {
      return { key: 'maps.relativeDate.unavailable', params: {} };
    }
    const days = Math.max(0, Math.floor((snapshot - played) / 86_400_000));
    if (days === 0) return { key: 'maps.relativeDate.sameDay', params: {} };
    if (days === 1) return { key: 'maps.relativeDate.oneDay', params: {} };
    return { key: 'maps.relativeDate.otherDays', params: { days } };
  }
}
