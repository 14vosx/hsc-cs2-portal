import { AsyncPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { catchError, map, Observable, of, startWith } from 'rxjs';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import { RankingPlayerDto } from '../../core/api/dto/ranking.dto';
import { DataCard } from '../../shared/components/data-card/data-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { MetricCard } from '../../shared/components/metric-card/metric-card';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

interface RankingReadyVm {
  state: 'ready';
  generatedAt: string;
  mapsFinalizados: number;
  players: RankingPlayerDto[];
  podium: RankingPlayerDto[];
}

type RankingVm = RankingReadyVm | { state: 'loading' } | { state: 'error' };

@Component({
  selector: 'app-ranking-page',
  imports: [AsyncPipe, DataCard, EmptyState, MetricCard, SectionHeader, StatusBadge],
  templateUrl: './ranking-page.html',
  styleUrl: './ranking-page.css',
})
export class RankingPage {
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly searchTerm = signal('');

  protected readonly vm$: Observable<RankingVm> = this.cs2Api.getRanking().pipe(
    map((ranking): RankingVm => {
      const players = ranking.players ?? [];

      return {
        state: 'ready',
        generatedAt: ranking.generatedAt,
        mapsFinalizados: ranking.mapsFinalizados ?? 0,
        players,
        podium: players.slice(0, 3),
      };
    }),
    startWith({ state: 'loading' } satisfies RankingVm),
    catchError(() => of({ state: 'error' } satisfies RankingVm)),
  );

  protected updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  protected filteredPlayers(players: RankingPlayerDto[]): RankingPlayerDto[] {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return players;
    }

    return players.filter((player) => {
      return (
        player.name.toLowerCase().includes(term) ||
        player.steamid64.toLowerCase().includes(term)
      );
    });
  }

  protected formatDate(value?: string): string {
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
