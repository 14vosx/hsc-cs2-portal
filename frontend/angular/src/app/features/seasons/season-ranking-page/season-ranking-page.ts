import { AsyncPipe } from '@angular/common';
import { Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { PageState } from '../../../shared/components/page-state/page-state';
import { SeasonTabs } from '../../../shared/components/season-tabs/season-tabs';
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
  imports: [AsyncPipe, EmptyState, PageHeader, PageState, SeasonPodium, SeasonTabs],
  templateUrl: './season-ranking-page.html',
  styleUrls: ['./season-ranking-page.css', './season-ranking-page-table.css'],
  encapsulation: ViewEncapsulation.None,
})
export class SeasonRankingPage {
  private readonly route = inject(ActivatedRoute);
  private readonly seasonRankingApi = inject(SeasonRankingApiService);
  private readonly reload$ = new Subject<void>();

  protected readonly searchTerm = signal('');

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

  protected eligibilityLabel(player: SeasonRankingPlayer): 'Elegível' | 'Em progresso' | 'Indefinido' {
    if (player.prizeEligible === true) {
      return 'Elegível';
    }

    if (player.prizeEligible === false) {
      return 'Em progresso';
    }

    return 'Indefinido';
  }

  protected eligibilityReason(player: SeasonRankingPlayer): string {
    if (player.prizeEligible) {
      return 'Elegível para premiação';
    }

    switch (player.prizeEligibilityReason) {
      case 'below_minimum_maps_and_rounds':
        return 'Faltam mapas e rounds';
      case 'below_minimum_maps':
        return 'Faltam mapas';
      case 'below_minimum_rounds':
        return 'Faltam rounds';
      default:
        return 'Em progresso';
    }
  }

  protected badgeClass(player: SeasonRankingPlayer): string {
    if (player.prizeEligible === true) {
      return 'season-ranking__badge--eligible';
    }

    if (player.prizeEligible === false) {
      return 'season-ranking__badge--progress';
    }

    return 'season-ranking__badge--neutral';
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
