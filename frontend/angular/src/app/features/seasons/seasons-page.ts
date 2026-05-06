import { AsyncPipe } from '@angular/common';
import { Component, ViewEncapsulation, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith } from 'rxjs';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import { SeasonDto } from '../../core/api/dto/season.dto';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { seasonCoverImage } from './season-ui';

interface SeasonsReadyVm {
  state: 'ready';
  activeSeasonSlug?: string | null;
  seasons: SeasonDto[];
}

type SeasonsVm = SeasonsReadyVm | { state: 'loading' } | { state: 'error' };

@Component({
  selector: 'app-seasons-page',
  imports: [AsyncPipe, EmptyState, RouterLink],
  templateUrl: './seasons-page.html',
  styleUrl: './seasons-page.css',
  encapsulation: ViewEncapsulation.None,
})
export class SeasonsPage {
  private readonly cs2Api = inject(Cs2ApiService);
  protected readonly seasonCoverImage = seasonCoverImage;

  protected readonly vm$: Observable<SeasonsVm> = this.cs2Api.getSeasons().pipe(
    map((payload): SeasonsVm => ({
      state: 'ready',
      activeSeasonSlug: payload.activeSeasonSlug,
      seasons: payload.seasons ?? [],
    })),
    startWith({ state: 'loading' } satisfies SeasonsVm),
    catchError(() => of({ state: 'error' } satisfies SeasonsVm)),
  );

  protected formatDate(value?: string | null): string {
    if (!value) {
      return 'Data em aberto';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  protected seasonLink(season: SeasonDto, activeSeasonSlug?: string | null): string {
    if (!season.slug) {
      return '/seasons';
    }

    return season.slug && season.slug === activeSeasonSlug ? '/seasons/current' : `/seasons/${season.slug}`;
  }

  protected rankingLink(season: SeasonDto, activeSeasonSlug?: string | null): string {
    if (!season.slug) {
      return '/seasons';
    }

    return season.slug && season.slug === activeSeasonSlug
      ? '/seasons/current/ranking'
      : `/seasons/${season.slug}/ranking`;
  }
}
