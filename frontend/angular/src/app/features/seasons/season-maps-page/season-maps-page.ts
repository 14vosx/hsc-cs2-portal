import { AsyncPipe } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { PageState } from '../../../shared/components/page-state/page-state';
import { SeasonTabs } from '../../../shared/components/season-tabs/season-tabs';
import { StatusBadge, type StatusBadgeVariant } from '../../../shared/components/status-badge/status-badge';
import { formatSeasonBoundaryDate } from '../season-ui';
import { SeasonMapsApiService } from '../data-access/season-maps-api.service';
import type { SeasonMaps, SeasonMapSummary } from '../domain/season-maps.model';

export type MapSort = 'published' | 'matches' | 'rounds' | 'lastPlayed' | 'name';

interface SeasonMapsReadyVm {
  state: 'ready';
  data: SeasonMaps;
}

interface SeasonMapsEmptyVm {
  state: 'empty';
  data: SeasonMaps;
}

type SeasonMapsVm =
  | SeasonMapsReadyVm
  | SeasonMapsEmptyVm
  | { state: 'loading' }
  | { state: 'season-unavailable' }
  | { state: 'error' };

@Component({
  selector: 'app-season-maps-page',
  imports: [
    AsyncPipe,
    RouterLink,
    PageState,
    SeasonTabs,
    StatusBadge,
  ],
  templateUrl: './season-maps-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './season-maps-page.css',
})
export class SeasonMapsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seasonMapsApi = inject(SeasonMapsApiService);
  private readonly reload$ = new Subject<void>();

  protected readonly searchTerm = signal('');
  protected readonly sortBy = signal<MapSort>('published');
  protected readonly formatSeasonBoundaryDate = formatSeasonBoundaryDate;

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

  protected readonly vm$: Observable<SeasonMapsVm> = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.route.paramMap.pipe(
        map((params) => params.get('slug')?.trim() || null),
        switchMap((slug) =>
          this.seasonMapsApi.getMaps(slug).pipe(
            map((result): SeasonMapsVm => {
              if (result.kind === 'season-unavailable') {
                return { state: 'season-unavailable' };
              }

              if (result.maps.maps.length === 0) {
                return { state: 'empty', data: result.maps };
              }

              return { state: 'ready', data: result.maps };
            }),
            startWith({ state: 'loading' } satisfies SeasonMapsVm),
            catchError(() => of({ state: 'error' } satisfies SeasonMapsVm))
          )
        )
      )
    )
  );

  protected retry(): void {
    this.reload$.next();
  }

  protected goBack(): void {
    this.router.navigate(['/seasons']);
  }

  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected updateSort(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortBy.set(select.value as MapSort);
  }

  protected visibleMaps(maps: readonly SeasonMapSummary[]): readonly SeasonMapSummary[] {
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
        if (b.matches !== a.matches) return b.matches - a.matches;
      } else if (sort === 'rounds') {
        if (b.rounds !== a.rounds) return b.rounds - a.rounds;
      } else if (sort === 'lastPlayed') {
        const timeA = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : NaN;
        const timeB = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : NaN;
        const validA = !Number.isNaN(timeA);
        const validB = !Number.isNaN(timeB);

        if (validA && validB && timeA !== timeB) {
          return timeB - timeA;
        }
        if (validA && !validB) return -1;
        if (!validA && validB) return 1;
      } else if (sort === 'name') {
        const cmp = a.name.localeCompare(b.name, 'pt-BR');
        if (cmp !== 0) return cmp;
      }

      return maps.indexOf(a) - maps.indexOf(b);
    });
  }

  protected seasonCoverStyle(url?: string | null): string {
    if (!url) {
      return 'none';
    }
    return `url("${url}")`;
  }

  protected mapBackgroundImage(name: string): string {
    if (!name || !this.knownMapImages.has(name)) {
      return 'none';
    }
    return `url("map-images/${name}.png")`;
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

  protected formatAvg(val: number): string {
    if (typeof val !== 'number' || !Number.isFinite(val)) {
      return '—';
    }
    return val.toFixed(1);
  }

  protected seasonStatusLabel(status?: string | null): string {
    if (!status) {
      return 'Status indisponível';
    }
    if (status.toLowerCase() === 'active') {
      return 'Season ativa';
    }
    if (status.toLowerCase() === 'closed') {
      return 'Season encerrada';
    }
    return status;
  }

  protected seasonStatusTone(status?: string | null): StatusBadgeVariant {
    if (status === 'active') {
      return 'active';
    }

    if (status === 'closed') {
      return 'closed';
    }

    return 'neutral';
  }
}
