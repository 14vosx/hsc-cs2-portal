import { AsyncPipe } from '@angular/common';
import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
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

type SeasonRankingVm =
  | ({ state: 'ready'; isCurrent: boolean } & SeasonRankingDto)
  | { state: 'loading' }
  | { state: 'error' };

@Component({
  selector: 'app-season-ranking-page',
  imports: [AsyncPipe, EmptyState, RouterLink, SeasonPodium],
  templateUrl: './season-ranking-page.html',
  styleUrl: './season-ranking-page.css',
  encapsulation: ViewEncapsulation.None,
})
export class SeasonRankingPage {
  private readonly route = inject(ActivatedRoute);
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly searchTerm = signal('');
  protected readonly playerAvatar = playerAvatar;
  protected readonly playerInitials = playerInitials;
  protected readonly eligibilityLabel = eligibilityLabel;
  protected readonly eligibilityReason = eligibilityReason;
  protected readonly formatInteger = formatInteger;
  protected readonly formatPercent = formatPercent;
  protected readonly formatStat = formatStat;
  protected readonly seasonCoverImage = seasonCoverImage;

  protected readonly vm$: Observable<SeasonRankingVm> = this.route.paramMap.pipe(
    map((params) => params.get('slug')?.trim() ?? ''),
    switchMap((slug) => this.loadRanking(slug)),
    startWith({ state: 'loading' } satisfies SeasonRankingVm),
    catchError(() => of({ state: 'error' } satisfies SeasonRankingVm)),
  );

  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected visiblePlayers(players?: SeasonRankingPlayerDto[]): SeasonRankingPlayerDto[] {
    const term = this.searchTerm().trim().toLowerCase();
    const list = players ?? [];

    return term
      ? list.filter((player) => (player.name ?? '').toLowerCase().includes(term))
      : list;
  }

  protected formatDate(value?: string | null, includeTime = false): string {
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

  protected formatNumber(value?: number | null, digits = 2): string {
    return typeof value === 'number' ? value.toFixed(digits) : '-';
  }

  protected seasonLink(isCurrent: boolean, slug?: string): string {
    return isCurrent || !slug ? '/seasons/current' : `/seasons/${slug}`;
  }

  protected rankingLink(isCurrent: boolean, slug?: string): string {
    return isCurrent || !slug ? '/seasons/current/ranking' : `/seasons/${slug}/ranking`;
  }

  protected badgeClass(player: SeasonRankingPlayerDto): string {
    if (player.prizeEligible === true) {
      return 'season-ranking__badge--eligible';
    }

    if (player.prizeEligible === false) {
      return 'season-ranking__badge--progress';
    }

    return 'season-ranking__badge--neutral';
  }

  protected minRoundsPerMap(rules?: SeasonRankingRulesDto | null): number | undefined {
    return rules?.minRoundsPerMap;
  }

  private loadRanking(slug: string): Observable<SeasonRankingVm> {
    if (slug) {
      return this.cs2Api.getSeasonRanking(slug).pipe(
        map((payload): SeasonRankingVm => ({ ...payload, state: 'ready', isCurrent: false })),
      );
    }

    return this.cs2Api.getSeasons().pipe(
      switchMap((index) => {
        const activeSeasonSlug = index.activeSeasonSlug?.trim();

        if (!activeSeasonSlug) {
          return of({ state: 'error' } satisfies SeasonRankingVm);
        }

        return this.cs2Api.getSeasonRanking(activeSeasonSlug).pipe(
          map((payload): SeasonRankingVm => ({ ...payload, state: 'ready', isCurrent: true })),
        );
      }),
    );
  }
}
