import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, map, Observable, of, startWith } from 'rxjs';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import { MapSummaryDto } from '../../core/api/dto/maps.dto';
import { DataCard } from '../../shared/components/data-card/data-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { MetricCard } from '../../shared/components/metric-card/metric-card';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

type MapSort = 'matches' | 'rounds' | 'lastPlayed';

interface MapsReadyVm {
  state: 'ready';
  generatedAt: string;
  maps: MapSummaryDto[];
  mostPlayedMap?: MapSummaryDto;
  totalMatches: number;
  totalRounds: number;
}

type MapsVm = MapsReadyVm | { state: 'loading' } | { state: 'error' };

@Component({
  selector: 'app-maps-page',
  imports: [AsyncPipe, DataCard, EmptyState, MetricCard, SectionHeader, StatusBadge],
  templateUrl: './maps-page.html',
  styleUrl: './maps-page.css',
})
export class MapsPage {
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly searchTerm = signal('');
  protected readonly sortBy = signal<MapSort>('matches');

  protected readonly vm$: Observable<MapsVm> = this.cs2Api.getMaps().pipe(
    map((payload): MapsVm => {
      const maps = payload.maps ?? [];

      return {
        state: 'ready',
        generatedAt: payload.generatedAt,
        maps,
        mostPlayedMap: maps[0],
        totalMatches: maps.reduce((total, current) => total + current.matches, 0),
        totalRounds: maps.reduce((total, current) => total + current.rounds, 0),
      };
    }),
    startWith({ state: 'loading' } satisfies MapsVm),
    catchError(() => of({ state: 'error' } satisfies MapsVm)),
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

  protected formatNumber(value: number, digits = 1): string {
    return value.toFixed(digits);
  }

  private mapTimestamp(mapSummary: MapSummaryDto): number {
    const timestamp = new Date(mapSummary.lastPlayed).getTime();

    if (Number.isNaN(timestamp)) {
      return 0;
    }

    return timestamp;
  }
}