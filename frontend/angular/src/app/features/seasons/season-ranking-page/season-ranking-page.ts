import { AsyncPipe } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PageState } from '../../../shared/components/page-state/page-state';
import { SeasonTabs } from '../../../shared/components/season-tabs/season-tabs';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { eligibilityLabel, eligibilityReason, formatSeasonBoundaryDate, seasonStatusLabel } from '../season-ui';
import { SeasonRankingApiService } from '../data-access/season-ranking-api.service';
import { SeasonRankingPlayer, SeasonRankingRules, SeasonRankingSeason } from '../domain/season-ranking.model';
import { SeasonPodium } from '../season-podium/season-podium';

type SeasonRankingVm =
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'season-unavailable' }
  | { state: 'empty'; ranking: SeasonRanking }
  | { state: 'ready'; ranking: SeasonRanking };

interface SeasonRanking {
  readonly generatedAt: string | null;
  readonly season: SeasonRankingSeason;
  readonly rules: SeasonRankingRules;
  readonly summary: SeasonRankingSummary;
  readonly topPrizeCandidates: readonly SeasonRankingPlayer[];
  readonly players: readonly SeasonRankingPlayer[];
}

interface SeasonRankingSummary {
  readonly matches: number;
  readonly maps: number;
  readonly rounds: number;
  readonly players: number;
  readonly eligiblePlayers: number;
  readonly lastMapEndedAt: string | null;
}

@Component({
  selector: 'app-season-ranking-page',
  imports: [AsyncPipe, EmptyState, PageState, RouterLink, SeasonPodium, SeasonTabs, StatusBadge, TranslatePipe],
  templateUrl: './season-ranking-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./season-ranking-page.css', './season-ranking-page-table.css'],
})
export class SeasonRankingPage {
  private readonly route = inject(ActivatedRoute);
  private readonly seasonRankingApi = inject(SeasonRankingApiService);
  private readonly reload$ = new Subject<void>();

  protected readonly searchTerm = signal('');
  protected readonly formatSeasonBoundaryDate = formatSeasonBoundaryDate;

  protected readonly vm$: Observable<SeasonRankingVm> = this.route.paramMap.pipe(
    map((params) => params.get('slug')?.trim() ?? null),
    switchMap((slug) =>
      this.reload$.pipe(
        startWith(undefined),
        switchMap(() =>
          this.loadRanking(slug).pipe(
            startWith({ state: 'loading' } satisfies SeasonRankingVm),
            catchError(() => of({ state: 'error' } satisfies SeasonRankingVm)),
          ),
        ),
      ),
    ),
  );

  protected retry(): void {
    this.reload$.next();
  }

  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected filteredPlayers(players: readonly SeasonRankingPlayer[]): readonly SeasonRankingPlayer[] {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return players;
    }

    return players.filter((player) => (player.name ?? '').toLowerCase().includes(term));
  }

  protected formatDate(value?: string | null, includeTime = false): string | null {
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
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
    }).format(date);
  }

  protected formatNumber(value?: number | null, digits = 2): string {
    return typeof value === 'number' ? value.toFixed(digits) : '-';
  }

  protected formatPercent(value?: number | null, digits = 1): string {
    return typeof value === 'number' ? `${value.toFixed(digits)}%` : '-';
  }

  protected playerAvatar(player?: SeasonRankingPlayer | null): string {
    return player?.avatarUrl ?? '';
  }

  protected playerInitials(player?: SeasonRankingPlayer | null): string {
    const name = player?.name?.trim();

    if (!name) {
      return 'HSC';
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  protected readonly eligibilityLabel = eligibilityLabel;
  protected readonly eligibilityReason = eligibilityReason;

  protected eligibilityTone(player: SeasonRankingPlayer): 'success' | 'info' | 'neutral' {
    if (player.prizeEligible === true) return 'success';
    if (player.prizeEligible === false) return 'info';
    return 'neutral';
  }

  protected readonly seasonStatusLabel = seasonStatusLabel;

  protected seasonStatusTone(status?: string | null): 'active' | 'closed' | 'neutral' {
    if (status === 'active') return 'active';
    if (status === 'closed') return 'closed';
    return 'neutral';
  }

  protected seasonCoverImage(season?: SeasonRankingSeason | null): string {
    const imageUrl = season?.coverImageUrl ?? '';
    return imageUrl ? `url("${imageUrl}")` : 'none';
  }

  protected minRoundsPerMap(rules?: SeasonRankingRules | null): number | undefined {
    return rules?.minRoundsPerMap;
  }

  private loadRanking(slug: string | null): Observable<SeasonRankingVm> {
    return this.seasonRankingApi.getRanking(slug).pipe(
      map((result): SeasonRankingVm => {
        if (result.kind === 'available') {
          return result.ranking.players.length === 0
            ? { state: 'empty', ranking: result.ranking }
            : { state: 'ready', ranking: result.ranking };
        }

        return { state: 'season-unavailable' };
      }),
      catchError(() => of({ state: 'error' } satisfies SeasonRankingVm)),
    );
  }
}
