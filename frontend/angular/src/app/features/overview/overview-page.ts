import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, startWith } from 'rxjs';

import { Cs2ApiService } from '../../core/api/cs2-api.service';
import { MapSummaryDto } from '../../core/api/dto/maps.dto';
import { MatchSummaryDto } from '../../core/api/dto/matches.dto';
import { RankingPlayerDto } from '../../core/api/dto/ranking.dto';
import { DataCard } from '../../shared/components/data-card/data-card';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { MetricCard } from '../../shared/components/metric-card/metric-card';
import { SectionHeader } from '../../shared/components/section-header/section-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

interface OverviewReadyVm {
  state: 'ready';
  apiOk: boolean;
  generatedAt: string;
  playersCount: number;
  matchesCount: number;
  mapsCount: number;
  leader?: RankingPlayerDto;
  latestMatch?: MatchSummaryDto;
  mostPlayedMap?: MapSummaryDto;
  topPlayers: RankingPlayerDto[];
  hasRanking: boolean;
  hasMatches: boolean;
  hasMaps: boolean;
}

type OverviewVm = OverviewReadyVm | { state: 'loading' } | { state: 'error' };

@Component({
  selector: 'app-overview-page',
  imports: [AsyncPipe, DataCard, EmptyState, MetricCard, SectionHeader, StatusBadge],
  templateUrl: './overview-page.html',
  styleUrl: './overview-page.css',
})
export class OverviewPage {
  private readonly cs2Api = inject(Cs2ApiService);

  protected readonly vm$: Observable<OverviewVm> = forkJoin({
    health: this.cs2Api.getHealth(),
    ranking: this.cs2Api.getRanking(),
    matches: this.cs2Api.getMatches(),
    maps: this.cs2Api.getMaps(),
  }).pipe(
    map(({ health, ranking, matches, maps }): OverviewVm => {
      const latestMatch = [...matches.matches].sort((current, next) => {
        const nextTime = this.matchTimestamp(next);
        const currentTime = this.matchTimestamp(current);

        if (nextTime !== currentTime) {
          return nextTime - currentTime;
        }

        return next.matchid - current.matchid;
      })[0];

      return {
        state: 'ready',
        apiOk: health.ok,
        generatedAt: health.generatedAt || ranking.generatedAt,
        playersCount: ranking.players.length,
        matchesCount: matches.matches.length,
        mapsCount: maps.maps.length,
        leader: ranking.players[0],
        latestMatch,
        mostPlayedMap: maps.maps[0],
        topPlayers: ranking.players.slice(0, 3),
        hasRanking: ranking.players.length > 0,
        hasMatches: matches.matches.length > 0,
        hasMaps: maps.maps.length > 0,
      };
    }),
    startWith({ state: 'loading' } satisfies OverviewVm),
    catchError(() => of({ state: 'error' } satisfies OverviewVm)),
  );

  protected formatDate(value?: string): string {
    if (!value) {
      return 'Sem data disponivel';
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

  protected formatScore(match: MatchSummaryDto): string {
    return `${match.team1_name} ${match.team1_score} x ${match.team2_score} ${match.team2_name}`;
  }

  protected playerMeta(player: RankingPlayerDto): string {
    return `${player.wins}V ${player.losses}D | K/D ${player.kdRatio.toFixed(2)}`;
  }

  private matchTimestamp(match: MatchSummaryDto): number {
    const timestamp = new Date(match.end_time || match.start_time).getTime();

    if (Number.isNaN(timestamp)) {
      return match.matchid;
    }

    return timestamp;
  }
}
