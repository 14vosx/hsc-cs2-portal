import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { PageHeader } from '../../../shared/components/page-header/page-header';
import { PageState } from '../../../shared/components/page-state/page-state';
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
interface RelativeDateDescriptor { readonly key: string; readonly params: { readonly days?: number }; }

@Component({
  selector: 'app-map-detail-page',
  imports: [
    AsyncPipe,
    RouterLink,
    PageHeader,
    PageState,
    MapRecentMatchTable,
    TranslatePipe,
  ],
  templateUrl: './map-detail-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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

  protected formatAvg(val: number): string {
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      return '0.0';
    }
    return val.toFixed(1);
  }

  protected mapBackgroundImage(name: string): string {
    if (!name || !this.knownMapImages.has(name)) {
      return 'none';
    }
    return `url("map-images/${name}.png")`;
  }

  protected relativeDate(value: string | null | undefined, generatedAt: string): RelativeDateDescriptor {
    const played = value ? new Date(value).getTime() : Number.NaN;
    const snapshot = new Date(generatedAt).getTime();
    if (Number.isNaN(played) || Number.isNaN(snapshot)) {
      return { key: 'mapDetail.relativeDate.unavailable', params: {} };
    }
    const days = Math.max(0, Math.floor((snapshot - played) / 86_400_000));
    if (days === 0) return { key: 'mapDetail.relativeDate.sameDay', params: {} };
    if (days === 1) return { key: 'mapDetail.relativeDate.oneDay', params: {} };
    return { key: 'mapDetail.relativeDate.otherDays', params: { days } };
  }
}
