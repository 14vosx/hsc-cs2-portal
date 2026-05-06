import { AsyncPipe } from '@angular/common';
import { Component, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import {
  SeasonRankingDto,
  SeasonRankingPlayerDto,
  SeasonRankingRulesDto,
} from '../../../core/api/dto/season-ranking.dto';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import {
  eligibilityLabel,
  eligibilityReason,
  formatInteger,
  formatPercent,
  formatStat,
  playerAvatar,
  playerInitials,
  seasonCoverImage,
} from '../season-ui';
import { SeasonPodium } from '../season-podium/season-podium';

type SeasonDetailVm =
  | ({ state: 'ready'; isCurrent: boolean } & SeasonRankingDto)
  | { state: 'loading' }
  | { state: 'error' };

@Component({
  selector: 'app-season-detail-page',
  imports: [AsyncPipe, EmptyState, RouterLink, SeasonPodium],
  templateUrl: './season-detail-page.html',
  styleUrl: './season-detail-page.css',
  encapsulation: ViewEncapsulation.None,
})
export class SeasonDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly vm$: Observable<SeasonDetailVm> = this.route.paramMap.pipe(
    map((params) => params.get('slug')?.trim() ?? ''),
    switchMap((slug) => this.loadSeasonHub(slug)),
    startWith({ state: 'loading' } satisfies SeasonDetailVm),
    catchError(() => of({ state: 'error' } satisfies SeasonDetailVm)),
  );

  protected readonly playerAvatar = playerAvatar;
  protected readonly playerInitials = playerInitials;
  protected readonly eligibilityLabel = eligibilityLabel;
  protected readonly eligibilityReason = eligibilityReason;
  protected readonly formatInteger = formatInteger;
  protected readonly formatPercent = formatPercent;
  protected readonly formatStat = formatStat;
  protected readonly seasonCoverImage = seasonCoverImage;

  protected formatDate(value?: string | null, includeTime = false): string {
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
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
    }).format(date);
  }

  protected formatNumber(value?: number | null, digits = 2): string {
    return typeof value === 'number' ? value.toFixed(digits) : '-';
  }

  protected tabLink(isCurrent: boolean, slug: string | undefined, target: 'overview' | 'ranking'): string {
    const base = isCurrent || !slug ? '/seasons/current' : `/seasons/${slug}`;
    return target === 'ranking' ? `${base}/ranking` : base;
  }

  protected rankingPreview(players?: SeasonRankingPlayerDto[]): SeasonRankingPlayerDto[] {
    return (players ?? []).slice(0, 12);
  }

  protected minRoundsPerMap(rules?: SeasonRankingRulesDto | null): number | undefined {
    return rules?.minRoundsPerMap;
  }

  private loadSeasonHub(slug: string): Observable<SeasonDetailVm> {
    if (slug) {
      return this.cs2Api.getSeasonRanking(slug).pipe(
        map((payload): SeasonDetailVm => ({ ...payload, state: 'ready', isCurrent: false })),
      );
    }

    return this.cs2Api.getSeasons().pipe(
      switchMap((index) => {
        const activeSeasonSlug = index.activeSeasonSlug?.trim();

        if (!activeSeasonSlug) {
          return of({ state: 'error' } satisfies SeasonDetailVm);
        }

        return this.cs2Api.getSeasonRanking(activeSeasonSlug).pipe(
          map((payload): SeasonDetailVm => ({ ...payload, state: 'ready', isCurrent: true })),
        );
      }),
    );
  }
}
