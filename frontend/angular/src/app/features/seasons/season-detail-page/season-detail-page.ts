import { AsyncPipe } from '@angular/common';
import { Component, ViewEncapsulation, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import { Cs2ApiService } from '../../../core/api/cs2-api.service';
import {
  SeasonRankingDto,
  SeasonRankingPlayerDto,
  SeasonRankingRulesDto,
} from '../../../core/api/dto/season-ranking.dto';
import { LocaleService } from '../../../core/i18n/locale.service';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import {
  eligibilityLabel,
  eligibilityReason,
  formatSeasonBoundaryDate,
  formatInteger,
  formatPercent,
  formatStat,
  playerAvatar,
  playerInitials,
  seasonCoverImage,
  seasonStatusLabel,
} from '../season-ui';
import { resolveSeasonContext } from '../season-context';
import { SeasonPodium } from '../season-podium/season-podium';

import {
  SeasonTabs,
  seasonTabLink,
} from '../../../shared/components/season-tabs/season-tabs';

type SeasonDetailVm =
  | ({ state: 'ready'; isCurrentRoute: boolean } & SeasonRankingDto)
  | { state: 'loading' }
  | { state: 'error' };

@Component({
  selector: 'app-season-detail-page',
  imports: [AsyncPipe, EmptyState, RouterLink, SeasonPodium, SeasonTabs, TranslatePipe],
  templateUrl: './season-detail-page.html',
  styleUrls: ['./season-detail-page.css', './season-detail-page-table.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class SeasonDetailPage {
  private readonly localeService = inject(LocaleService);
  private readonly route = inject(ActivatedRoute);
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly vm$: Observable<SeasonDetailVm> = this.route.paramMap.pipe(
    map((params) => params.get('slug')?.trim() ?? ''),
    switchMap((slug) => this.loadSeasonHub(slug, !slug)),
    startWith({ state: 'loading' } satisfies SeasonDetailVm),
    catchError(() => of({ state: 'error' } satisfies SeasonDetailVm)),
  );

  protected readonly playerAvatar = playerAvatar;
  protected readonly formatSeasonBoundaryDate = formatSeasonBoundaryDate;
  protected readonly playerInitials = playerInitials;
  protected readonly eligibilityLabel = eligibilityLabel;
  protected readonly eligibilityReason = eligibilityReason;
  protected readonly formatInteger = formatInteger;
  protected readonly formatPercent = formatPercent;
  protected readonly formatStat = formatStat;
  protected readonly seasonCoverImage = seasonCoverImage;
  protected readonly seasonStatusLabel = seasonStatusLabel;
  protected readonly seasonTabLink = seasonTabLink;

  protected formatDate(value?: string | null, includeTime = false): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.localeService.currentLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
    }).format(date);
  }

  protected formatNumber(value?: number | null, digits = 2): string {
    return typeof value === 'number' ? value.toFixed(digits) : '—';
  }

  protected rankingPreview(players?: SeasonRankingPlayerDto[]): SeasonRankingPlayerDto[] {
    return (players ?? []).slice(0, 5);
  }

  protected minRoundsPerMap(rules?: SeasonRankingRulesDto | null): number | undefined {
    return rules?.minRoundsPerMap;
  }

  private loadSeasonHub(slug: string, isCurrentRoute: boolean): Observable<SeasonDetailVm> {
    if (slug) {
      return this.cs2Api.getSeasonRanking(slug).pipe(
        map((payload): SeasonDetailVm => ({
          ...payload,
          state: 'ready',
          isCurrentRoute,
        })),
      );
    }

    return this.cs2Api.getSeasons().pipe(
      switchMap((index) => {
        const context = resolveSeasonContext(index);

        if (!context) {
          return of({ state: 'error' } satisfies SeasonDetailVm);
        }

        return this.cs2Api.getSeasonRanking(context.slug).pipe(
          map((payload): SeasonDetailVm => ({
            ...payload,
            state: 'ready',
            isCurrentRoute,
          })),
        );
      }),
    );
  }
}
