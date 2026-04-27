import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import { MapDetailDto, MapDetailRecentMatchDto } from '../../../core/api/dto/map-detail.dto';
import { DataCard } from '../../../shared/components/data-card/data-card';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { MetricCard } from '../../../shared/components/metric-card/metric-card';
import { SectionHeader } from '../../../shared/components/section-header/section-header';

interface MapDetailReadyVm {
  state: 'ready';
  detail: MapDetailDto;
}

type MapDetailVm = MapDetailReadyVm | { state: 'loading' } | { state: 'error' };

@Component({
  selector: 'app-map-detail-page',
  imports: [AsyncPipe, RouterLink, DataCard, EmptyState, MetricCard, SectionHeader],
  templateUrl: './map-detail-page.html',
  styleUrl: './map-detail-page.css',
})
export class MapDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly vm$: Observable<MapDetailVm> = this.route.paramMap.pipe(
    map((params) => params.get('map') ?? ''),
    switchMap((mapName) => {
      if (!mapName) {
        return of({ state: 'error' } satisfies MapDetailVm);
      }

      return this.cs2Api.getMap(mapName).pipe(
        map((detail) => ({ state: 'ready', detail }) satisfies MapDetailVm),
        startWith({ state: 'loading' } satisfies MapDetailVm),
        catchError(() => of({ state: 'error' } satisfies MapDetailVm)),
      );
    }),
  );

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

  protected formatSeriesScore(match: MapDetailRecentMatchDto): string {
    return `${match.team1.score} x ${match.team2.score}`;
  }

  protected formatMapScore(match: MapDetailRecentMatchDto): string {
    return `${match.mapScore.team1}-${match.mapScore.team2}`;
  }

  protected winnerLabel(match: MapDetailRecentMatchDto): string {
    return match.winner || 'Sem vencedor';
  }

  protected isWinner(match: MapDetailRecentMatchDto, teamName: string): boolean {
    return match.winner === teamName;
  }
}