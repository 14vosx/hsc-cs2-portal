import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { UiCard } from '../../../shared/components/card/card';
import { MetricCard } from '../../../shared/components/metric-card/metric-card';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { PageState } from '../../../shared/components/page-state/page-state';
import { SectionHeader } from '../../../shared/components/section-header/section-header';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { MapsApiService } from '../data-access/maps-api.service';
import type { MapDetail } from '../domain/map.model';
import { MapRecentMatchTable } from '../map-recent-match-table/map-recent-match-table';

interface MapDetailReadyVm {
  state: 'ready';
  detail: MapDetail;
}

type MapDetailVm =
  | MapDetailReadyVm
  | { state: 'loading' }
  | { state: 'not-found' }
  | { state: 'error' };

@Component({
  selector: 'app-map-detail-page',
  imports: [
    AsyncPipe,
    RouterLink,
    MetricCard,
    PageHeader,
    PageState,
    SectionHeader,
    StatusBadge,
    UiCard,
    MapRecentMatchTable,
  ],
  templateUrl: './map-detail-page.html',
  styleUrl: './map-detail-page.css',
})
export class MapDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mapsApi = inject(MapsApiService);
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

  protected readonly vm$: Observable<MapDetailVm> = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.route.paramMap.pipe(
        map((params) => params.get('map') ?? ''),
        switchMap((mapNameRaw) => {
          const trimmed = mapNameRaw.trim();
          if (!trimmed) {
            return of({ state: 'not-found' } satisfies MapDetailVm);
          }

          return this.mapsApi.getMap(trimmed).pipe(
            map((detail) => ({ state: 'ready', detail }) satisfies MapDetailVm),
            startWith({ state: 'loading' } satisfies MapDetailVm),
            catchError((err: unknown) => {
              if (err instanceof HttpErrorResponse && err.status === 404) {
                return of({ state: 'not-found' } satisfies MapDetailVm);
              }
              return of({ state: 'error' } satisfies MapDetailVm);
            })
          );
        })
      )
    )
  );

  protected retry(): void {
    this.reload$.next();
  }

  protected goBack(): void {
    this.router.navigate(['/maps']);
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

  protected formatAvg(val: number): string {
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      return '0.0';
    }
    return val.toFixed(1);
  }

  protected encodedMapName(name: string): string {
    return encodeURIComponent(name);
  }

  protected mapBackgroundImage(name: string): string {
    if (!name || !this.knownMapImages.has(name)) {
      return 'none';
    }
    return `url("map-images/${name}.png")`;
  }
}