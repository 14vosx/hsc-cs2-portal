import { AsyncPipe } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { UiCard } from '../../shared/components/card/card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { MetricCard } from '../../shared/components/metric-card/metric-card';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PageState } from '../../shared/components/page-state/page-state';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { RankingApiService } from './data-access/ranking-api.service';
import type { RankingPlayer } from './domain/ranking.model';

interface RankingReadyVm {
  state: 'ready';
  generatedAt: string | null;
  completedMaps: number;
  players: readonly RankingPlayer[];
  rankedPlayerCount: number;
  leader: RankingPlayer | null;
  podium: readonly RankingPlayer[];
}

type RankingVm =
  | RankingReadyVm
  | { state: 'loading' }
  | { state: 'error' }
  | { state: 'empty' };

@Component({
  selector: 'app-ranking-page',
  imports: [
    AsyncPipe,
    EmptyState,
    MetricCard,
    PageHeader,
    PageState,
    SectionHeader,
    StatusBadge,
    UiCard,
  ],
  templateUrl: './ranking-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './ranking-page.css',
})
export class RankingPage {
  private readonly rankingApi = inject(RankingApiService);
  private readonly reload$ = new Subject<void>();

  protected readonly searchTerm = signal('');

  protected readonly vm$: Observable<RankingVm> = this.reload$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.rankingApi.getRanking().pipe(
        map((ranking): RankingVm => {
          if (ranking.players.length === 0) {
            return { state: 'empty' };
          }

          return {
            state: 'ready',
            generatedAt: ranking.generatedAt,
            completedMaps: ranking.completedMaps,
            players: ranking.players,
            rankedPlayerCount: ranking.rankedPlayerCount,
            leader: ranking.leader,
            podium: ranking.players.slice(0, 3),
          };
        }),
        startWith({ state: 'loading' } satisfies RankingVm),
        catchError(() => of({ state: 'error' } satisfies RankingVm)),
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

  protected filteredPlayers(players: readonly RankingPlayer[]): readonly RankingPlayer[] {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return players;
    }

    return players.filter((player) => {
      return (
        (player.name ?? '').toLowerCase().includes(term) ||
        player.steamId64.toLowerCase().includes(term)
      );
    });
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

  protected formatNumber(value: number, digits = 1): string {
    return value.toFixed(digits);
  }

  protected formatPct(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  protected formatRateAsPct(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
  }
}
